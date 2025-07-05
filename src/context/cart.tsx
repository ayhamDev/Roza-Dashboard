"use client";
import type React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";

// Cart item interface
export interface CartItem {
  item_id: number;
  name: string;
  retail_price: number;
  quantity: number;
  image_url: string | null;
  category_name?: string;
  stock_quantity: number;
}

// Cart state interface
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Cart actions
type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: { item_id: number } }
  | { type: "UPDATE_QUANTITY"; payload: { item_id: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

// Cart context interface
interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (item_id: number) => void;
  updateQuantity: (item_id: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (item_id: number) => boolean;
  getItemQuantity: (item_id: number) => number;
  isLoaded: boolean;
}

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

// Calculate totals helper
const calculateTotals = (
  items: CartItem[]
): { totalItems: number; totalPrice: number } => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.retail_price * item.quantity,
    0
  );
  return { totalItems, totalPrice };
};

// Cart reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.item_id === action.payload.item_id
      );

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Item exists, increment quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // New item, add to cart
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }

      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (item) => item.item_id !== action.payload.item_id
      );
      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        // Remove item if quantity is 0 or less
        const newItems = state.items.filter(
          (item) => item.item_id !== action.payload.item_id
        );
        const { totalItems, totalPrice } = calculateTotals(newItems);

        return {
          items: newItems,
          totalItems,
          totalPrice,
        };
      }

      const newItems = state.items.map((item) =>
        item.item_id === action.payload.item_id
          ? {
              ...item,
              quantity: Math.min(action.payload.quantity, item.stock_quantity),
            }
          : item
      );

      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case "CLEAR_CART": {
      return initialState;
    }

    case "LOAD_CART": {
      const { totalItems, totalPrice } = calculateTotals(action.payload);
      return {
        items: action.payload,
        totalItems,
        totalPrice,
      };
    }

    default:
      return state;
  }
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Local storage key generator - include campaign_id for campaign-specific carts
const getCartStorageKey = (campaign_id?: string) => {
  return campaign_id ? `shopping-cart-${campaign_id}` : "shopping-cart";
};

// Cart provider component
export const CartProvider: React.FC<{
  children: React.ReactNode;
  campaign_id?: string;
}> = ({ children, campaign_id }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storageKey = getCartStorageKey(campaign_id);
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: parsedCart });
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, [campaign_id]);

  // Save cart to localStorage whenever state changes (but only after initial load)
  useEffect(() => {
    if (!isLoaded) return; // Don't save until we've loaded from localStorage

    try {
      const storageKey = getCartStorageKey(campaign_id);
      localStorage.setItem(storageKey, JSON.stringify(state.items));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [state.items, campaign_id, isLoaded]);

  // Cart actions
  const addItem = (item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeItem = (item_id: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: { item_id } });
  };

  const updateQuantity = (item_id: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { item_id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const isInCart = (item_id: number): boolean => {
    return state.items.some((item) => item.item_id === item_id);
  };

  const getItemQuantity = (item_id: number): number => {
    const item = state.items.find((item) => item.item_id === item_id);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    isLoaded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
