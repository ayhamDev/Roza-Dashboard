"use client";

import logo from "@/assets/Rozalogo.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Facebook,
  Filter,
  Hash,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  Twitter,
} from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState, useCallback } from "react";
import { AppThemeToggle } from "@/components/app/AppThemeToggle";
import { CartSheet } from "@/components/sheets/cart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart";
import { useDebounce } from "@/hooks/use-debounce";
import { getImageUrl } from "@/lib/GetImageUrl";
import { supabase } from "@/supabase";

export const Route = createFileRoute("/catalog/$campaign_id/")({
  component: RouteComponent,
});

// Updated interfaces to match database schema
interface Item {
  item_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  is_catalog_visible: boolean;
  category_id: number | null;
  category_name?: string;
}

interface ItemCategory {
  category_id: number;
  name: string;
  icon: string | null;
}

interface CatalogInfo {
  catalog_id: number;
  name: string;
  status: string;
}

interface Client {
  client_id: number;
  name: string;
  email: string;
  phone?: string;
  whatsapp_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: number;
  country?: string;
}

interface CampaignRecipient {
  recipient_id: string;
  client_id: number;
  campaign_id: string;
  delivery_method: string;
  status: string | null;
  client: Client;
}

const ITEMS_PER_PAGE = 6;

// Custom hook to get URL parameters using Web API
function useURLParams() {
  const [params, setParams] = useState<URLSearchParams>(new URLSearchParams());

  useEffect(() => {
    const updateParams = () => {
      setParams(new URLSearchParams(window.location.search));
    };

    updateParams();

    const handlePopState = () => {
      updateParams();
    };

    window.addEventListener("popstate", handlePopState);

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      updateParams();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      updateParams();
    };

    return () => {
      window.removeEventListener("popstate", handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return params;
}

// Inner component that uses the cart context
function CatalogContent() {
  const { campaign_id } = Route.useParams();
  const urlParams = useURLParams();
  const recipientId = urlParams.get("recipient");

  // URL state management with nuqs
  const [urlState, setUrlState] = useQueryStates({
    search: parseAsString.withDefault(""),
    category: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1),
    sort: parseAsString.withDefault("name"),
  });

  // Local search state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(urlState.search);

  // Debounce the local search term for server-side filtering
  const debouncedSearch = useDebounce(localSearch, 300);

  const [scrollY, setScrollY] = useState(0);
  const { addItem, items, isInCart, getItemQuantity } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync local search with URL state on mount and URL changes
  useEffect(() => {
    setLocalSearch(urlState.search);
  }, [urlState.search]);

  // Handle search input changes
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Update URL state for browser history (optional)
      setUrlState({ search: value, page: 1 });
    },
    [setUrlState]
  );

  // Query campaign recipient data first (if recipient ID is provided)
  const {
    data: campaignRecipient,
    isLoading: recipientLoading,
    error: recipientError,
  } = useQuery({
    queryKey: ["campaign-recipient", recipientId],
    queryFn: async (): Promise<CampaignRecipient | null> => {
      if (!recipientId) return null;

      const { data, error } = await supabase
        .from("campaign_recipient")
        .select(
          `
          recipient_id,
          client_id,
          campaign_id,
          delivery_method,
          status,
          client:client_id (
            client_id,
            name,
            email,
            phone,
            whatsapp_phone,
            address_line1,
            address_line2,
            city,
            state,
            zip,
            country
          )
        `
        )
        .eq("recipient_id", recipientId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          throw new Error("Recipient not found");
        }
        throw error;
      }

      return data as CampaignRecipient;
    },
    enabled: !!recipientId,
    retry: false, // Don't retry on 404
  });

  // Query catalog info by campaign_id
  const { data: catalogInfo, isLoading: catalogLoading } = useQuery({
    queryKey: ["catalog-info", campaign_id],
    queryFn: async (): Promise<CatalogInfo | null> => {
      const { data, error } = await supabase
        .from("campaign")
        .select(
          `
          catalog_id,
          catalog:catalog_id (
            catalog_id,
            name,
            status
          )
        `
        )
        .eq("campaign_id", campaign_id)
        .single();

      if (error) throw error;

      return data?.catalog as CatalogInfo;
    },
  });

  // Query all categories for the filter dropdown - show all system categories
  const { data: allCategories = [] } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async (): Promise<ItemCategory[]> => {
      const { data, error } = await supabase
        .from("item_category")
        .select("*")
        .order("name");

      if (error) throw error;

      return data;
    },
  });

  // Query items with server-side filtering - now using debouncedSearch
  const {
    data: itemsData = { items: [], totalCount: 0 },
    isLoading: itemsLoading,
    isFetching: itemsFetching,
  } = useQuery({
    queryKey: [
      "catalog-items",
      catalogInfo?.catalog_id,
      debouncedSearch, // Use debounced search instead of urlState.search
      urlState.category,
      urlState.sort,
      urlState.page,
    ],
    queryFn: async (): Promise<{ items: Item[]; totalCount: number }> => {
      if (!catalogInfo?.catalog_id) return { items: [], totalCount: 0 };

      // Calculate pagination
      const from = (urlState.page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Build the query with server-side filtering - scoped to catalog items only
      let query = supabase
        .from("catalog_transitions")
        .select(
          `
          item:item_id (
            item_id,
            name,
            description,
            image_url,
            cost_price,
            retail_price,
            wholesale_price,
            stock_quantity,
            is_catalog_visible,
            category_id,
            item_category:category_id (
              name
            )
          )
        `,
          { count: "exact" }
        )
        .eq("catalog_id", catalogInfo.catalog_id)
        .eq("item.is_catalog_visible", true);

      // Apply search filter on server-side using debounced search
      if (debouncedSearch) {
        query = query.ilike("item.name", `%${debouncedSearch}%`);
      }

      // Apply category filter on server-side
      if (urlState.category !== "all") {
        // Find the category_id for the selected category name
        const selectedCategory = allCategories.find(
          (cat) => cat.name.toLowerCase() === urlState.category.toLowerCase()
        );
        if (selectedCategory) {
          query = query.eq("item.category_id", selectedCategory.category_id);
        }
      }

      // Apply sorting
      switch (urlState.sort) {
        case "price-low":
          query = query.order("item(retail_price)", { ascending: true });
          break;
        case "price-high":
          query = query.order("item(retail_price)", { ascending: false });
          break;
        default:
          query = query.order("item(name)", { ascending: true });
          break;
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data
      const items: Item[] = data
        .map((transition: any) => {
          const item = transition.item;
          if (!item) return null;

          return {
            ...item,
            category_name: item.item_category?.name || null,
          };
        })
        .filter(Boolean);

      return { items, totalCount: count || 0 };
    },
    enabled: !!catalogInfo?.catalog_id,
    // Keep previous data while fetching to prevent loading states during filtering
    placeholderData: (previousData) => previousData,
  });

  // Scroll detection for app bar
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (urlState.page > 1 && (debouncedSearch || urlState.category !== "all")) {
      setUrlState({ page: 1 });
    }
  }, [debouncedSearch, urlState.category, setUrlState, urlState.page]);

  // Calculate pagination
  const totalPages = Math.ceil(itemsData.totalCount / ITEMS_PER_PAGE);

  // Category options - only categories that exist in this catalog
  const categoryOptions = [
    "all",
    ...allCategories.map((cat: ItemCategory) => cat.name.toLowerCase()),
  ];

  // Cart functions
  const addToCart = (item: Item) => {
    addItem({
      item_id: item.item_id,
      name: item.name,
      retail_price: item.retail_price,
      image_url: item.image_url,
      category_name: item.category_name,
      stock_quantity: item.stock_quantity,
    });
  };

  // Show full page loading only on initial mount when we have no data
  const isInitialLoading =
    catalogLoading ||
    (recipientId && recipientLoading) ||
    (itemsLoading && !itemsData.items.length);

  // Show recipient error if there's an issue with recipient lookup
  if (recipientId && recipientError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Recipient Not Found</AlertTitle>
            <AlertDescription className="mt-2">
              The recipient ID "{recipientId}" could not be found. Please check
              the link or contact support.
            </AlertDescription>
          </Alert>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-[500px] opacity-40 dark:opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-gray-400 dark:from-blue-700"></div>
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-[100px] w-[100px] border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {recipientId && recipientLoading
              ? "Loading recipient information..."
              : "Loading catalog..."}
          </p>
          <div
            aria-hidden="true"
            className="absolute inset-0 grid grid-cols-2 -space-x-[500px] opacity-40 dark:opacity-20"
          >
            <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700"></div>
            <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mx-auto">
      {/* Enhanced Translucent App Bar with scroll-based background */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 mx-auto ${
          scrollY > 10
            ? "bg-background/50 backdrop-blur-lg shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container px-4 md:px-6 h-20 flex items-center justify-between mx-auto">
          <div className="flex items-center space-x-3">
            <div>
              <span className="font-bold text-xl">Roza Wholesale</span>
              <p className="text-xs text-muted-foreground">Premium Products</p>
            </div>
          </div>
          <div className="flex items-center gap-4 print:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="" />
              {items.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {items.length}
                </Badge>
              )}
            </Button>
            <AppThemeToggle />
          </div>
        </div>
      </header>

      {/* Cart Sheet - Pass client data if available */}
      <div className="print:hidden">
        <CartSheet
          open={isCartOpen}
          onOpenChange={setIsCartOpen}
          client={campaignRecipient?.client || null}
          recipientId={recipientId}
          catalogInfo={catalogInfo as any}
        />
      </div>

      {/* Enhanced Hero Section - 2 Column Layout */}
      <section className="relative dark:shadow-lg min-h-[50vh] mx-auto py-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container px-4 md:px-6 relative z-10 h-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(50vh-5rem)]">
            {/* Left Column - Logo */}
            <div className="flex items-center justify-center lg:justify-start">
              <div className="text-center lg:text-left">
                {/* Logo placeholder - replace with your actual logo */}
                <img
                  src={logo || "/placeholder.svg"}
                  alt=""
                  className="w-[250px] m-auto py-4 select-none "
                />
                {/* Contact Info under logo */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-center lg:justify-start items-center gap-4 text-sm md:text-base">
                  <div className="flex items-center space-x-2 text-primary font-bold bg-primary/10 px-3 py-2 rounded-full">
                    <Phone className="h-4 w-4" />
                    <span>804-800-7692</span>
                  </div>
                  <div className="flex items-center space-x-2 text-primary font-bold bg-primary/10 px-3 py-2 rounded-full">
                    <Phone className="h-4 w-4" />
                    <span>804-800-ROZA</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column - Content */}
            <div className="space-y-6 ">
              {/* Show personalized greeting if recipient is available */}
              {campaignRecipient?.client && (
                <div className="bg-primary/10 rounded-lg p-4 mb-6">
                  <p className="text-lg font-medium">
                    Hello {campaignRecipient.client.name}! 👋
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This catalog has been personalized for you
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-wide bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Discover Amazing Products
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Find everything you need in our curated collection of premium
                  products. Quality, style, and value in every purchase.
                </p>
              </div>
              {/* Enhanced Catalog and Promotion Info */}
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">
                      Catalog:
                    </span>
                    <Badge
                      variant="outline"
                      className="font-bold text-base px-3 py-1"
                    >
                      {catalogInfo?.name || "Loading..."}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <Badge
                      variant="secondary"
                      className="mb-2 text-sm px-3 py-1"
                    >
                      🎉 Special Promotion
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      <strong>While supplies last</strong> • Min order $200
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container px-4 md:px-6 py-8 md:py-12 mx-auto ">
        {/* Enhanced Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-12"
              />
              {/* Show search loading indicator when local search is different from debounced search */}
              {localSearch !== debouncedSearch && localSearch && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={urlState.category}
                onValueChange={(value) =>
                  setUrlState({ category: value, page: 1 })
                }
              >
                <SelectTrigger className="w-full sm:w-[180px] h-12">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={urlState.sort}
                onValueChange={(value) => setUrlState({ sort: value })}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort: Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Results info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {itemsData.items.length} of {itemsData.totalCount}{" "}
              products
              {debouncedSearch && ` for "${debouncedSearch}"`}
              {urlState.category !== "all" && ` in ${urlState.category}`}
            </span>
            {/* Show fetching indicator for background updates */}
            {itemsFetching && itemsData.items.length > 0 && (
              <span className="flex items-center gap-2 text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Updating...
              </span>
            )}
          </div>
        </div>

        {/* Product Grid with Enhanced Hover Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8 min-h-[400px]">
          {itemsData.items.length === 0 && !itemsLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch || urlState.category !== "all"
                  ? "Try adjusting your search or filters"
                  : "No products available in this catalog"}
              </p>
              {(debouncedSearch || urlState.category !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setLocalSearch("");
                    setUrlState({ search: "", category: "all", page: 1 });
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            itemsData.items.map((item) => (
              <Card
                key={item.item_id}
                className="hover:shadow-lg pt-0 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
              >
                <div className="absolute top-[-3px]  left-[-3px] z-20">
                  <Badge variant={"default"} className="rounded-none">
                    <Hash size={20} />
                    {item.item_id}
                  </Badge>
                </div>
                <div className="relative">
                  <CardHeader className="p-0 relative group/image">
                    <div className="aspect-square overflow-hidden rounded-t-lg relative">
                      <img
                        src={getImageUrl(item.image_url) || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-500 ease-out"
                      />
                    </div>
                  </CardHeader>
                  <div className="group/content relative">
                    <CardContent className="relative z-10 pt-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {item.category_name}
                          </Badge>
                          {item.stock_quantity === 0 && (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {item.name}
                        </CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                        <div className="text-2xl font-bold text-primary">
                          ${item.retail_price}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
                <CardFooter className="pt-0 mt-auto relative z-30">
                  {isInCart(item.item_id) ? (
                    <Button
                      className="w-full mt-auto"
                      variant="secondary"
                      onClick={() => setIsCartOpen(true)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      In Cart ({getItemQuantity(item.item_id)})
                    </Button>
                  ) : (
                    <Button
                      className="w-full mt-auto"
                      disabled={item.stock_quantity === 0}
                      onClick={() => addToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (urlState.page > 1)
                        setUrlState({ page: urlState.page - 1 });
                    }}
                    className={
                      urlState.page === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= urlState.page - 1 && page <= urlState.page + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setUrlState({ page });
                            }}
                            isActive={urlState.page === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === urlState.page - 2 ||
                      page === urlState.page + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (urlState.page < totalPages)
                        setUrlState({ page: urlState.page + 1 });
                    }}
                    className={
                      urlState.page === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex justify-between items-center flex-wrap">
            {/* Company Info */}
            <div className="space-y-4 max-w-[250px]">
              <h3 className="text-lg font-semibold">Roza Wholesale</h3>
              <p className="text-sm text-muted-foreground">
                Your trusted destination for quality products and exceptional
                service. We're committed to bringing you the best shopping
                experience.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    123 Commerce St, City, State 12345
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">804-800-7692</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">804-800-ROZA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    support@shophub.com
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Roza. All rights reserved.
            </p>
            {/* <div className="flex space-x-6 text-sm">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookie Policy
              </a>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main component that provides the cart context
function RouteComponent() {
  return <CatalogContent />;
}

export default RouteComponent;
