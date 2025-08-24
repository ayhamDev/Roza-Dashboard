"use client";

import logo from "@/assets/Rozalogo.svg";
import { AppThemeToggle } from "@/components/app/AppThemeToggle";
import { CartSheet } from "@/components/sheets/cart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

export const Route = createFileRoute("/catalog/$campaign_id/")({
  component: RouteComponent,
});

// Interfaces to match Edge Function response
interface Item {
  item_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  category_id: number | null;
  category_name?: string;
  in_stock: boolean;
}

interface ItemCategory {
  category_id: number;
  name: string;
  icon: string | null;
}

interface CatalogInfo {
  catalog_id: number;
  name: string;
  status: "enabled" | "disabled" | "draft";
}

interface Client {
  client_id: number;
  name: string;
  email: string;
}

interface CampaignRecipient {
  recipient_id: string;
  client_id: number;
  campaign_id: string;
  client: Client;
}

interface EdgeFunctionResponse {
  campaignRecipient: CampaignRecipient | null;
  catalogInfo: CatalogInfo | null;
  allCategories: ItemCategory[];
  itemsData: { items: Item[]; totalCount: number };
}

const ITEMS_PER_PAGE = 10;

// Custom hook to get URL parameters
function useURLParams() {
  const [params, setParams] = useState<URLSearchParams>(new URLSearchParams());
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);
  return params;
}

// Inner component that uses the cart context
function CatalogContent() {
  const { campaign_id } = Route.useParams();
  const urlParams = useURLParams();
  const recipientId = urlParams.get("recipient");

  const [isPending, startTransition] = useTransition();

  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(""),
      category: parseAsString.withDefault("all"),
      page: parseAsInteger.withDefault(1),
      sort: parseAsString.withDefault("name"),
    },
    { history: "replace" }
  );

  const [localSearch, setLocalSearch] = useState(urlState.search);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setLocalSearch(urlState.search);
  }, [urlState.search]);

  useEffect(() => {
    if (debouncedSearch !== urlState.search) {
      startTransition(() => {
        setUrlState({ search: debouncedSearch, page: 1 });
      });
    }
  }, [debouncedSearch, urlState.search, setUrlState]);

  const [scrollY, setScrollY] = useState(0);
  const { addItem, items, isInCart, getItemQuantity } = useCart();
  const [isCartOpen, setIsCartOpen] = useQueryState(
    "cart",
    parseAsBoolean.withDefault(false).withOptions({ history: "push" })
  );

  const {
    data: edgeFunctionData,
    isLoading: isInitialLoading,
    error: edgeFunctionError,
  } = useQuery<EdgeFunctionResponse, Error>({
    queryKey: ["catalog-data", campaign_id, recipientId],
    queryFn: async (): Promise<EdgeFunctionResponse> => {
      if (!recipientId || !campaign_id) {
        throw new Error("Missing recipient ID or campaign ID.");
      }
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/campaign?campaign_id=${campaign_id}&recipient_id=${recipientId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);

        throw new Error(errorData.error || "Failed to fetch catalog data.");
      }
      return response.json();
    },
    enabled: !!recipientId && !!campaign_id,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const campaignRecipient = edgeFunctionData?.campaignRecipient;
  const catalogInfo = edgeFunctionData?.catalogInfo;
  const allCategories = edgeFunctionData?.allCategories || [];
  const allItems = edgeFunctionData?.itemsData?.items || [];

  const filteredAndSortedItems = useMemo(() => {
    let items = [...allItems];

    if (urlState.search) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(urlState.search.toLowerCase())
      );
    }

    if (urlState.category && urlState.category !== "all") {
      items = items.filter(
        (item) =>
          item.category_name?.toLowerCase() === urlState.category.toLowerCase()
      );
    }

    switch (urlState.sort) {
      case "price-low":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        items.sort((a, b) => b.price - a.price);
        break;
      default:
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return items;
  }, [allItems, urlState.search, urlState.category, urlState.sort]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const startIndex = (urlState.page - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedItems.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedItems, urlState.page]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categoryOptions = useMemo(
    () => [
      "all",
      ...allCategories.map((cat: ItemCategory) => cat.name.toLowerCase()),
    ],
    [allCategories]
  );

  const addToCart = useCallback(
    (item: Item) => {
      addItem({
        item_id: item.item_id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        category_name: item.category_name,
        stock_quantity: item.in_stock ? 999 : 0,
      });
    },
    [addItem]
  );

  if (edgeFunctionError || !recipientId || !campaign_id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Catalog</AlertTitle>
          <AlertDescription className="mt-2">
            {edgeFunctionError?.message ||
              "Missing recipient ID or campaign ID."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-[100px] w-[100px] border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mx-auto">
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
              <ShoppingCart />
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

      <div className="print:hidden">
        <CartSheet
          open={isCartOpen}
          onOpenChange={setIsCartOpen}
          client={campaignRecipient?.client || null}
          recipientId={recipientId}
          campaignId={campaign_id}
          catalogInfo={catalogInfo || null}
        />
      </div>

      <section className="relative dark:shadow-lg min-h-[50vh] mx-auto py-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container px-4 md:px-6 relative z-10 h-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(50vh-5rem)]">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="text-center lg:text-left">
                <img
                  src={logo || "/placeholder.svg"}
                  alt="Roza Wholesale Logo"
                  className="w-[250px] m-auto py-4 select-none"
                />
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
            <div className="space-y-6">
              {campaignRecipient?.client && (
                <div className="bg-primary/10 rounded-lg p-4 mb-6">
                  <p className="text-lg font-medium">
                    Hello {campaignRecipient.client.name}!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This catalog has been personalized for you.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-wide bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Discover Amazing Products
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Find everything you need in our curated collection of premium
                  products.
                </p>
              </div>
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
                      Special Promotion
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

      <main className="container px-4 md:px-6 py-8 md:py-12 mx-auto">
        <div className="space-y-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={urlState.category}
                onValueChange={(value) => {
                  startTransition(() => {
                    setUrlState({ category: value, page: 1 });
                  });
                }}
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
                onValueChange={(value) => {
                  startTransition(() => {
                    setUrlState({ sort: value });
                  });
                }}
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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {isPending && (
              <span className="flex items-center gap-2 text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Updating...
              </span>
            )}
          </div>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8 min-h-[400px] transition-opacity duration-300 ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
          {paginatedItems.length === 0 && !isPending ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setLocalSearch("");
                  startTransition(() => {
                    setUrlState({ search: "", category: "all", page: 1 });
                  });
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            paginatedItems.map((item: Item) => (
              <Card
                key={item.item_id}
                className="hover:shadow-lg pt-0 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative flex flex-col"
              >
                <div className="absolute top-[-3px] left-[-3px] z-20">
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
                          {!item.in_stock && (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {item.name}
                        </CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                        <div className="text-2xl font-bold text-primary">
                          ${item.price}
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
                      disabled={!item.in_stock}
                      onClick={() => addToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.in_stock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (urlState.page > 1) {
                        startTransition(() => {
                          setUrlState({ page: urlState.page - 1 });
                        });
                      }
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
                              startTransition(() => {
                                setUrlState({ page });
                              });
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
                      if (urlState.page < totalPages) {
                        startTransition(() => {
                          setUrlState({ page: urlState.page + 1 });
                        });
                      }
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

      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex justify-between items-center flex-wrap">
            <div className="space-y-4 max-w-[250px]">
              <h3 className="text-lg font-semibold">Roza Wholesale</h3>
              <p className="text-sm text-muted-foreground">
                Your trusted destination for quality products and exceptional
                service.
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
                    support@roza.com
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
          </div>
        </div>
      </footer>
    </div>
  );
}

function RouteComponent() {
  return <CatalogContent />;
}

export default RouteComponent;
