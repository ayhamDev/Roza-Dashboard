"use client";

// --- STEP 1: Imports ---
import { useQuery } from "@tanstack/react-query";
import { wrap, type Remote } from "comlink";
import { AlertTriangle, Download, Eye, Loader2 } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// --- UI Component Imports ---
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// --- Supabase & Utilities ---
import { supabase } from "@/supabase"; // Adjust path as needed

// --- Type Imports ---
import type { PdfWorkerApi } from "@/lib/pdf.worker";
import {
  CoverLayouts,
  type CatalogDocumentProps,
  type CategoryWithProducts,
  type CompanyInfo,
  type CoverLayout,
  type Theme,
} from "./CatalogDocument";
import { useBreadcrumbs } from "@/context/breadcrumpst";

// --- COLOR PRESETS ---
type ColorPresetTheme = Omit<Theme, "fontFamily">;

const colorPresets: { name: string; theme: ColorPresetTheme }[] = [
  {
    name: "Sunshine Gold",
    theme: {
      cover: {
        primaryColor: "#f5b50b",
        secondaryColor: "#1F2937",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
      },
      toc: {
        headerColor: "#1F2937",
        pageNumberColor: "#f5b50b",
        borderColor: "#E5E5E5",
        textColor: "#111827",
      },
      content: {
        categoryHeaderBackgroundColor: "#fdecc8",
        categoryHeaderTextColor: "#1F2937",
        productPriceColor: "#f5b50b",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
      },
      backCover: {
        primaryColor: "#1F2937",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Ocean Blue",
    theme: {
      cover: {
        primaryColor: "#00A9E0",
        secondaryColor: "#003366",
        backgroundColor: "#F0F4F8",
        textColor: "black",
      },
      toc: {
        headerColor: "#003366",
        pageNumberColor: "#00A9E0",
        borderColor: "#D1E0EC",
        textColor: "#003366",
      },
      content: {
        categoryHeaderBackgroundColor: "#E0F3FA",
        categoryHeaderTextColor: "#003366",
        productPriceColor: "#00A9E0",
        backgroundColor: "#FFFFFF",
        textColor: "#003366",
      },
      backCover: {
        primaryColor: "#003366",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Forest Green",
    theme: {
      cover: {
        primaryColor: "#6A994E",
        secondaryColor: "#386641",
        backgroundColor: "#F2E8CF",
        textColor: "#2B412F",
      },
      toc: {
        headerColor: "#386641",
        pageNumberColor: "#6A994E",
        borderColor: "#D8CDBA",
        textColor: "#2B412F",
      },
      content: {
        categoryHeaderBackgroundColor: "#EAF2E5",
        categoryHeaderTextColor: "#386641",
        productPriceColor: "#6A994E",
        backgroundColor: "#FFFFFF",
        textColor: "#2B412F",
      },
      backCover: {
        primaryColor: "#386641",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Modern Ruby",
    theme: {
      cover: {
        primaryColor: "#D81159",
        secondaryColor: "#218380",
        backgroundColor: "#FFFFFF",
        textColor: "#333333",
      },
      toc: {
        headerColor: "#218380",
        pageNumberColor: "#D81159",
        borderColor: "#EAEAEA",
        textColor: "#333333",
      },
      content: {
        categoryHeaderBackgroundColor: "#FAE7EF",
        categoryHeaderTextColor: "#218380",
        productPriceColor: "#D81159",
        backgroundColor: "#FFFFFF",
        textColor: "#333333",
      },
      backCover: {
        primaryColor: "#218380",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Charcoal Slate",
    theme: {
      cover: {
        primaryColor: "#FFC700",
        secondaryColor: "#343A40",
        backgroundColor: "#F8F9FA",
        textColor: "#212529",
      },
      toc: {
        headerColor: "#212529",
        pageNumberColor: "#FFC700",
        borderColor: "#DEE2E6",
        textColor: "#343A40",
      },
      content: {
        categoryHeaderBackgroundColor: "#E9ECEF",
        categoryHeaderTextColor: "#212529",
        productPriceColor: "#D3A100",
        backgroundColor: "#FFFFFF",
        textColor: "#343A40",
      },
      backCover: {
        primaryColor: "#343A40",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Coral Sunset",
    theme: {
      cover: {
        primaryColor: "#FF6B6B",
        secondaryColor: "#4ECDC4",
        backgroundColor: "#FFF8F5",
        textColor: "#2C3E50",
      },
      toc: {
        headerColor: "#2C3E50",
        pageNumberColor: "#FF6B6B",
        borderColor: "#F0E6E1",
        textColor: "#2C3E50",
      },
      content: {
        categoryHeaderBackgroundColor: "#FFE8E8",
        categoryHeaderTextColor: "#2C3E50",
        productPriceColor: "#FF6B6B",
        backgroundColor: "#FFFFFF",
        textColor: "#2C3E50",
      },
      backCover: {
        primaryColor: "#4ECDC4",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Royal Purple",
    theme: {
      cover: {
        primaryColor: "#8B5CF6",
        secondaryColor: "#1E293B",
        backgroundColor: "#F8FAFC",
        textColor: "#0F172A",
      },
      toc: {
        headerColor: "#1E293B",
        pageNumberColor: "#8B5CF6",
        borderColor: "#E2E8F0",
        textColor: "#0F172A",
      },
      content: {
        categoryHeaderBackgroundColor: "#F3F0FF",
        categoryHeaderTextColor: "#1E293B",
        productPriceColor: "#8B5CF6",
        backgroundColor: "#FFFFFF",
        textColor: "#0F172A",
      },
      backCover: {
        primaryColor: "#1E293B",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Warm Terracotta",
    theme: {
      cover: {
        primaryColor: "#E07A5F",
        secondaryColor: "#3D5A80",
        backgroundColor: "#F4F3EE",
        textColor: "#2F2F2F",
      },
      toc: {
        headerColor: "#3D5A80",
        pageNumberColor: "#E07A5F",
        borderColor: "#D4C5B9",
        textColor: "#2F2F2F",
      },
      content: {
        categoryHeaderBackgroundColor: "#F7E6E0",
        categoryHeaderTextColor: "#3D5A80",
        productPriceColor: "#E07A5F",
        backgroundColor: "#FFFFFF",
        textColor: "#2F2F2F",
      },
      backCover: {
        primaryColor: "#3D5A80",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Mint Fresh",
    theme: {
      cover: {
        primaryColor: "#2DD4BF",
        secondaryColor: "#1F2937",
        backgroundColor: "#F0FDFA",
        textColor: "#134E4A",
      },
      toc: {
        headerColor: "#1F2937",
        pageNumberColor: "#2DD4BF",
        borderColor: "#CCFBF1",
        textColor: "#134E4A",
      },
      content: {
        categoryHeaderBackgroundColor: "#E6FFFA",
        categoryHeaderTextColor: "#1F2937",
        productPriceColor: "#2DD4BF",
        backgroundColor: "#FFFFFF",
        textColor: "#134E4A",
      },
      backCover: {
        primaryColor: "#1F2937",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Burgundy Wine",
    theme: {
      cover: {
        primaryColor: "#991B1B",
        secondaryColor: "#92400E",
        backgroundColor: "#FEF7F0",
        textColor: "#451A03",
      },
      toc: {
        headerColor: "#451A03",
        pageNumberColor: "#991B1B",
        borderColor: "#FED7AA",
        textColor: "#451A03",
      },
      content: {
        categoryHeaderBackgroundColor: "#FEE2E2",
        categoryHeaderTextColor: "#451A03",
        productPriceColor: "#991B1B",
        backgroundColor: "#FFFFFF",
        textColor: "#451A03",
      },
      backCover: {
        primaryColor: "#92400E",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Steel Blue",
    theme: {
      cover: {
        primaryColor: "#0EA5E9",
        secondaryColor: "#475569",
        backgroundColor: "#F8FAFC",
        textColor: "#1E293B",
      },
      toc: {
        headerColor: "#475569",
        pageNumberColor: "#0EA5E9",
        borderColor: "#CBD5E1",
        textColor: "#1E293B",
      },
      content: {
        categoryHeaderBackgroundColor: "#E0F2FE",
        categoryHeaderTextColor: "#475569",
        productPriceColor: "#0EA5E9",
        backgroundColor: "#FFFFFF",
        textColor: "#1E293B",
      },
      backCover: {
        primaryColor: "#475569",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Lavender Dreams",
    theme: {
      cover: {
        primaryColor: "#A855F7",
        secondaryColor: "#6366F1",
        backgroundColor: "#FAF5FF",
        textColor: "#581C87",
      },
      toc: {
        headerColor: "#581C87",
        pageNumberColor: "#A855F7",
        borderColor: "#E9D5FF",
        textColor: "#581C87",
      },
      content: {
        categoryHeaderBackgroundColor: "#F3E8FF",
        categoryHeaderTextColor: "#581C87",
        productPriceColor: "#A855F7",
        backgroundColor: "#FFFFFF",
        textColor: "#581C87",
      },
      backCover: {
        primaryColor: "#6366F1",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
  {
    name: "Autumn Spice",
    theme: {
      cover: {
        primaryColor: "#EA580C",
        secondaryColor: "#78350F",
        backgroundColor: "#FFFBEB",
        textColor: "#451A03",
      },
      toc: {
        headerColor: "#78350F",
        pageNumberColor: "#EA580C",
        borderColor: "#FED7AA",
        textColor: "#451A03",
      },
      content: {
        categoryHeaderBackgroundColor: "#FFEDD5",
        categoryHeaderTextColor: "#78350F",
        productPriceColor: "#EA580C",
        backgroundColor: "#FFFFFF",
        textColor: "#451A03",
      },
      backCover: {
        primaryColor: "#78350F",
        textColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
      },
    },
  },
];

// --- HOOK for Debouncing (Performance) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- DATA FETCHING ---
async function fetchCatalogData(
  catalogId: number
): Promise<{ catalogName: string; categories: CategoryWithProducts[] }> {
  const { data: catalogInfo, error: catalogError } = await supabase
    .from("catalog")
    .select("name")
    .eq("catalog_id", catalogId)
    .single();
  if (catalogError)
    throw new Error(`Could not fetch catalog info: ${catalogError.message}`);

  const { data: transitions, error: transitionsError } = await supabase
    .from("catalog_transitions")
    .select("item_id")
    .eq("catalog_id", catalogId);
  if (transitionsError)
    throw new Error(
      `Could not fetch catalog items: ${transitionsError.message}`
    );
  if (!transitions || transitions.length === 0)
    return { catalogName: catalogInfo.name, categories: [] };

  const itemIds = transitions.map((t) => t.item_id);
  const { data: items, error: itemsError } = await supabase
    .from("item")
    .select("*, item_category(*)")
    .in("item_id", itemIds)
    .eq("is_catalog_visible", true);

  if (itemsError)
    throw new Error(`Could not fetch item details: ${itemsError.message}`);
  if (!items) return { catalogName: catalogInfo.name, categories: [] };

  const categoriesMap = new Map<number, CategoryWithProducts>();
  for (const item of items) {
    if (!item.item_category) continue;
    const category = item.item_category;
    if (!categoriesMap.has(category.category_id)) {
      categoriesMap.set(category.category_id, { ...category, products: [] });
    }
    categoriesMap.get(category.category_id)!.products.push(item);
  }
  return {
    catalogName: catalogInfo.name,
    categories: Array.from(categoriesMap.values()),
  };
}

// --- CUSTOM HOOK to Manage the PDF Worker ---
function usePdfWorker(props: CatalogDocumentProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isWorkerLoading, setWorkerLoading] = useState(true);
  const workerApiRef = useRef<Remote<PdfWorkerApi> | null>(null);

  useEffect(() => {
    const workerInstance = new Worker(
      new URL("../../../lib/pdf.worker", import.meta.url),
      { type: "module" }
    );
    workerApiRef.current = wrap<PdfWorkerApi>(workerInstance);
    return () => workerInstance.terminate();
  }, []);

  useEffect(() => {
    if (!workerApiRef.current || props.categories.length === 0) {
      setWorkerLoading(false);
      return;
    }

    let newUrl: string | null = null;
    const generatePdf = async () => {
      setWorkerLoading(true);
      try {
        const blob = await workerApiRef.current!.render(props);
        newUrl = URL.createObjectURL(blob);
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(newUrl);
      } catch (error) {
        console.error("Failed to render PDF in worker:", error);
        setPdfUrl(null);
      } finally {
        setWorkerLoading(false);
      }
    };

    generatePdf();

    return () => {
      if (newUrl) URL.revokeObjectURL(newUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  return { pdfUrl, isWorkerLoading };
}

// --- MAIN COMPONENT ---
export function CatalogBuilder({ catalogId }: { catalogId: number }) {
  const [info, setInfo] = useState<CompanyInfo>({
    name: "Your Company",
    tagline: "MULTIPURPOSE",
    year: new Date().getFullYear().toString(),
    logoUrl: "",
    phone: "+1 234 567 8900",
    email: "hello@creative.co",
    website: "www.creative.co",
    address: "123 Design Street, Suite 456, Art City, 78901",
  });
  const { setBreadcrumbs } = useBreadcrumbs();
  const [theme, setTheme] = useState<Theme>(() => ({
    fontFamily: { heading: "Helvetica-Bold", body: "Helvetica" },
    ...colorPresets[0].theme,
  }));
  const [selectedPreset, setSelectedPreset] = useState<string>(
    colorPresets[0].name
  );
  const [coverLayout, setCoverLayout] = useState<CoverLayout>("minimalist-arc");
  // --- MODIFICATION START ---
  // Add state for the number of product columns
  const [productColumns, setProductColumns] = useState<number>(3);
  // --- MODIFICATION END ---

  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [showPreviewAlert, setShowPreviewAlert] = useState(false);

  const debouncedInfo = useDebounce(info, 500);
  const debouncedTheme = useDebounce(theme, 500);
  const debouncedLayout = useDebounce(coverLayout, 500);
  // --- MODIFICATION START ---
  // Debounce the new columns state
  const debouncedProductColumns = useDebounce(productColumns, 500);
  // --- MODIFICATION END ---

  const {
    data: catalogData,
    isLoading: isFetchingData,
    error,
  } = useQuery({
    queryKey: ["catalog-pdf", catalogId],
    queryFn: () => fetchCatalogData(catalogId),
    enabled: !!catalogId,
  });
  const categories = catalogData?.categories || [];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo((i) => ({ ...i, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetChange = (presetName: string) => {
    const selected = colorPresets.find((p) => p.name === presetName);
    if (selected) {
      setTheme((current) => ({
        ...selected.theme,
        fontFamily: current.fontFamily,
      }));
      setSelectedPreset(presetName);
    }
  };

  const tocEntries = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    // --- MODIFICATION START ---
    // Calculate products per page based on the selected number of columns
    const productsPerRow = debouncedProductColumns;
    const rowsPerPage = productsPerRow == 2 ? 2 : productsPerRow == 5 ? 4 : 3; // Assuming 3 rows per page is a constant
    const PRODUCTS_PER_PAGE = productsPerRow * rowsPerPage;

    // --- MODIFICATION END ---

    const entries = [];
    let currentPage = 3;
    for (const category of categories) {
      if (category.products.length === 0) continue;
      entries.push({ name: category.name, page: currentPage });
      const pagesForCategory = Math.ceil(
        category.products.length / PRODUCTS_PER_PAGE
      );
      currentPage += pagesForCategory;
    }
    return entries;
    // --- MODIFICATION START ---
    // Add debouncedProductColumns to the dependency array
  }, [categories, debouncedProductColumns]);
  // --- MODIFICATION END ---

  const documentProps = useMemo<CatalogDocumentProps>(
    () => ({
      categories,
      info: debouncedInfo,
      theme: debouncedTheme,
      tocEntries,
      coverLayout: debouncedLayout,
      // --- MODIFICATION START ---
      // Pass the debounced column value to the document props
      productColumns: debouncedProductColumns,
      // --- MODIFICATION END ---
      isPreviewMode,
    }),
    [
      categories,
      debouncedInfo,
      debouncedTheme,
      tocEntries,
      debouncedLayout,
      // --- MODIFICATION START ---
      // Add the debounced column value to the dependency array
      debouncedProductColumns,
      // --- MODIFICATION END ---
      isPreviewMode,
    ]
  );

  const { pdfUrl, isWorkerLoading } = usePdfWorker(documentProps);

  const handleDownload = useCallback(() => {
    if (isPreviewMode) {
      setShowPreviewAlert(true);
      return;
    }
    setShowPreviewAlert(false);

    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${catalogData?.catalogName || "Catalog"}_${info.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, catalogData?.catalogName, info.year, isPreviewMode]);

  useEffect(() => {
    if (showPreviewAlert) {
      const timer = setTimeout(() => setShowPreviewAlert(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showPreviewAlert]);

  useLayoutEffect(() => {
    setBreadcrumbs([
      { id: "dashboard", label: "Dashboard", href: "/dashboard" },
      { id: "catalog", label: "Catalogs", href: "/dashboard/catalog" },
      {
        id: "catalog_name",
        label: catalogData ? catalogData?.catalogName : "Loading...",
        isActive: true,
      },
    ]);
  }, [catalogData, setBreadcrumbs]);

  if (isFetchingData)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
        <p className="ml-4 text-lg">Fetching Catalog Data...</p>
      </div>
    );
  if (error)
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const fontFamilies = [
    "Helvetica",
    "Helvetica-Bold",
    "Times-Roman",
    "Courier",
  ];

  return (
    <div className="flex h-[calc(100vh-61px)] font-sans bg-muted/40 relative">
      {(isWorkerLoading || isFetchingData) && (
        <div className="absolute  inset-0 dark:bg-white/70 bg-accent-foreground/50 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground font-medium">
            {isFetchingData ? "Fetching Data..." : "Generating Pdf..."}
          </p>
        </div>
      )}
      <aside className="w-[420px] h-full flex-shrink-0 relative">
        <Card className="h-full rounded-none border-0 border-r flex flex-col">
          <CardHeader>
            <CardTitle>Catalog Editor</CardTitle>
            <CardDescription>{catalogData?.catalogName}</CardDescription>
          </CardHeader>

          <div className="px-6 py-4 border-b border-t bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="preview-mode"
                  className="text-base font-semibold text-amber-900 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Fast Preview Mode
                </Label>
                <p className="text-xs text-amber-800">
                  Disables product images for faster updates. Turn off for final
                  download.
                </p>
              </div>
              <Switch
                id="preview-mode"
                checked={isPreviewMode}
                onCheckedChange={setIsPreviewMode}
              />
            </div>
          </div>

          <CardContent className="flex-grow overflow-y-auto pr-4 pt-6">
            <Accordion
              type="multiple"
              defaultValue={["item-1", "item-2", "item-3"]}
              className="w-full"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm font-semibold">
                  Layout & Branding
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="layout">Cover Layout</Label>
                    <Select
                      value={coverLayout}
                      onValueChange={(value: CoverLayout) =>
                        setCoverLayout(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a layout" />
                      </SelectTrigger>
                      <SelectContent>
                        {CoverLayouts.map((layout) => (
                          <SelectItem key={layout} value={layout}>
                            {layout}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* --- MODIFICATION START --- */}
                  {/* Add the Select input for choosing the number of columns */}
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="product-columns">Products per Row</Label>
                    <Select
                      value={String(productColumns)}
                      onValueChange={(value) =>
                        setProductColumns(Number(value))
                      }
                    >
                      <SelectTrigger id="product-columns">
                        <SelectValue placeholder="Select number of columns" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5].map((cols) => (
                          <SelectItem key={cols} value={String(cols)}>
                            {cols} Columns
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* --- MODIFICATION END --- */}
                  <div className="grid w-full items-center gap-1.5">
                    <Label>Logo Upload</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleLogoUpload}
                      className="pt-1.5"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={info.name}
                      onChange={(e) =>
                        setInfo((i) => ({ ...i, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="tagline">Catalog Tagline</Label>
                    <Input
                      id="tagline"
                      type="text"
                      value={info.tagline}
                      onChange={(e) =>
                        setInfo((i) => ({ ...i, tagline: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="text"
                      value={info.year}
                      onChange={(e) =>
                        setInfo((i) => ({ ...i, year: e.target.value }))
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-sm font-semibold">
                  Theme & Typography
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="preset">Color Preset</Label>
                    <Select
                      value={selectedPreset}
                      onValueChange={handlePresetChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a preset..." />
                      </SelectTrigger>
                      <SelectContent>
                        {colorPresets.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-xs text-muted-foreground">
                    GLOBAL FONTS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label>Heading</Label>
                      <Select
                        value={theme.fontFamily.heading}
                        onValueChange={(val) =>
                          setTheme((t) => ({
                            ...t,
                            fontFamily: { ...t.fontFamily, heading: val },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Body</Label>
                      <Select
                        value={theme.fontFamily.body}
                        onValueChange={(val) =>
                          setTheme((t) => ({
                            ...t,
                            fontFamily: { ...t.fontFamily, body: val },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-xs text-muted-foreground">
                    COVER COLORS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label>Primary</Label>
                      <Input
                        type="color"
                        value={theme.cover.primaryColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            cover: { ...t.cover, primaryColor: e.target.value },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Secondary</Label>
                      <Input
                        type="color"
                        value={theme.cover.secondaryColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            cover: {
                              ...t.cover,
                              secondaryColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Background</Label>
                      <Input
                        type="color"
                        value={theme.cover.backgroundColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            cover: {
                              ...t.cover,
                              backgroundColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Text</Label>
                      <Input
                        type="color"
                        value={theme.cover.textColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            cover: { ...t.cover, textColor: e.target.value },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-xs text-muted-foreground">
                    INDEX COLORS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label>Header</Label>
                      <Input
                        type="color"
                        value={theme.toc.headerColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            toc: { ...t.toc, headerColor: e.target.value },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Page Number</Label>
                      <Input
                        type="color"
                        value={theme.toc.pageNumberColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            toc: { ...t.toc, pageNumberColor: e.target.value },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-xs text-muted-foreground">
                    MAIN CONTENT COLORS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label>Category BG</Label>
                      <Input
                        type="color"
                        value={theme.content.categoryHeaderBackgroundColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            content: {
                              ...t.content,
                              categoryHeaderBackgroundColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Category Text</Label>
                      <Input
                        type="color"
                        value={theme.content.categoryHeaderTextColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            content: {
                              ...t.content,
                              categoryHeaderTextColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Price</Label>
                      <Input
                        type="color"
                        value={theme.content.productPriceColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            content: {
                              ...t.content,
                              productPriceColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Body Text</Label>
                      <Input
                        type="color"
                        value={theme.content.textColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            content: {
                              ...t.content,
                              textColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-xs text-muted-foreground">
                    BACK COVER COLORS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label>Primary</Label>
                      <Input
                        type="color"
                        value={theme.backCover.primaryColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            backCover: {
                              ...t.backCover,
                              primaryColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Text</Label>
                      <Input
                        type="color"
                        value={theme.backCover.textColor}
                        onChange={(e) => {
                          setTheme((t) => ({
                            ...t,
                            backCover: {
                              ...t.backCover,
                              textColor: e.target.value,
                            },
                          }));
                          setSelectedPreset("");
                        }}
                        className="p-1 h-10"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-sm font-semibold">
                  Contact Information
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="text"
                      value={info.phone}
                      onChange={(e) =>
                        setInfo((i) => ({ ...i, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={info.email}
                      onChange={(e) =>
                        setInfo((i) => ({ ...i, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="text"
                      value={info.website}
                      onChange={(e) =>
                        setInfo((i) => ({ ...i, website: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={info.address}
                      onChange={(e) =>
                        setInfo((i) => ({ ...i, address: e.target.value }))
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          {categories.length > 0 && (
            <CardFooter className="pt-4 border-t flex-col items-start">
              {showPreviewAlert && (
                <Alert variant="destructive" className="mb-4 w-full">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Preview Mode is On</AlertTitle>
                  <AlertDescription>
                    Please turn off "Fast Preview Mode" before downloading the
                    final PDF.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleDownload}
                disabled={isWorkerLoading || !pdfUrl}
                className="w-full"
              >
                {isWorkerLoading && isPreviewMode ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Updating Preview...
                  </>
                ) : isWorkerLoading && !isPreviewMode ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Generating Final PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-2" /> Download PDF
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </aside>

      <main className="flex-grow h-full p-4 relative">
        <div className="w-full h-full rounded-md border overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              className="border-0"
              title="Catalog Preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <p className="text-muted-foreground">
                {isWorkerLoading
                  ? "Generating Preview..."
                  : "No items found for this catalog."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
