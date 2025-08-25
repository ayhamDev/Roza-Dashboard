"use client";

// --- STEP 1: Imports ---
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wrap, type Remote } from "comlink";
import {
  AlertTriangle,
  Download,
  Eye,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

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
import type { Json } from "@/interface/database.types";
import { supabase } from "@/supabase";

// --- Type Imports ---
import { useBreadcrumbs } from "@/context/breadcrumpst";
import type { PdfWorkerApi } from "@/lib/pdf.worker";
import {
  CoverLayouts,
  type CatalogDocumentProps,
  type CategoryWithProducts,
  type CompanyInfo,
  type CoverLayout,
  type Theme,
} from "./CatalogDocument";

// --- TYPES & DEFAULTS ---
type TypePriceDisplay = "wholesale_price" | "retail_price" | "none";
interface CatalogOptions {
  info: CompanyInfo;
  theme: Theme;
  selectedPreset: string;
  coverLayout: CoverLayout;
  productColumns: number;
  priceDisplay: TypePriceDisplay;
}

const defaultOptions: CatalogOptions = {
  priceDisplay: "wholesale_price",
  info: {
    name: "Your Company",
    tagline: "MULTIPURPOSE",
    year: new Date().getFullYear().toString(),
    logoUrl: "",
    phone: "+1 234 567 8900",
    email: "hello@creative.co",
    website: "www.creative.co",
    address: "123 Design Street, Suite 456, Art City, 78901",
  },
  theme: {
    fontFamily: { heading: "Helvetica-Bold", body: "Helvetica" },
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
  selectedPreset: "Sunshine Gold",
  coverLayout: "minimalist-arc",
  productColumns: 3,
};

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

// --- DATA FETCHING ---
async function fetchCatalogData(catalogId: number): Promise<{
  catalogName: string;
  categories: CategoryWithProducts[];
  options: Json | null;
}> {
  const { data: catalogInfo, error: catalogError } = await supabase
    .from("catalog")
    .select("name, options")
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
    return {
      catalogName: catalogInfo.name,
      categories: [],
      options: catalogInfo.options,
    };

  const itemIds = transitions.map((t) => t.item_id);
  const { data: items, error: itemsError } = await supabase
    .from("item")
    .select("*, item_category(*)")
    .in("item_id", itemIds)
    .eq("is_catalog_visible", true);
  if (itemsError)
    throw new Error(`Could not fetch item details: ${itemsError.message}`);
  if (!items)
    return {
      catalogName: catalogInfo.name,
      categories: [],
      options: catalogInfo.options,
    };

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
    options: catalogInfo.options,
  };
}

// --- CUSTOM HOOK to Manage the PDF Worker ---
function usePdfWorker(props: CatalogDocumentProps | null) {
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
    if (!workerApiRef.current || !props || props.categories.length === 0) {
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
  const queryClient = useQueryClient();
  const queryKey = ["catalog-builder", catalogId];

  const [currentOptions, setCurrentOptions] = useState<CatalogOptions | null>(
    null
  );
  const [initialOptions, setInitialOptions] = useState<CatalogOptions | null>(
    null
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [showPreviewAlert, setShowPreviewAlert] = useState(false);
  const { setBreadcrumbs } = useBreadcrumbs();

  const {
    data: catalogData,
    isLoading: isFetchingData,
    error,
  } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchCatalogData(catalogId),
    enabled: !!catalogId,
  });

  useEffect(() => {
    if (catalogData && !initialOptions) {
      const mergedOptions: CatalogOptions = {
        ...defaultOptions,
        ...(catalogData.options as Partial<CatalogOptions>),
        info: {
          ...defaultOptions.info,
          ...((catalogData.options as any)?.info || {}),
        },
        theme: {
          ...defaultOptions.theme,
          ...((catalogData.options as any)?.theme || {}),
        },
      };
      setInitialOptions(mergedOptions);
      setCurrentOptions(mergedOptions);
    }
  }, [catalogData, initialOptions]);

  const { mutate: saveOptions, isPending: isSaving } = useMutation({
    mutationFn: async (optionsToSave: CatalogOptions) => {
      const { error } = await supabase
        .from("catalog")
        .update({ options: optionsToSave as any })
        .eq("catalog_id", catalogId);
      if (error) throw new Error(error.message);
      return optionsToSave;
    },
    onSuccess: (savedData) => {
      setInitialOptions(savedData);
      queryClient.invalidateQueries({ queryKey: queryKey });
      toast.success("Catalog saved successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  useEffect(() => {
    if (!currentOptions || !initialOptions) {
      setIsDirty(false);
      return;
    }
    const hasChanges =
      JSON.stringify(currentOptions) !== JSON.stringify(initialOptions);
    setIsDirty(hasChanges);
  }, [currentOptions, initialOptions]);

  const handleSave = () => {
    if (currentOptions && isDirty) {
      saveOptions(currentOptions);
    }
  };
  const handleCancel = () => {
    setCurrentOptions(initialOptions);
  };

  // const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setCurrentOptions((prev) =>
  //         prev
  //           ? {
  //               ...prev,
  //               info: { ...prev.info, logoUrl: reader.result as string },
  //             }
  //           : prev
  //       );
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handlePresetChange = (presetName: string) => {
    const selected = colorPresets.find((p) => p.name === presetName);
    if (selected) {
      setCurrentOptions((prev) =>
        prev
          ? {
              ...prev,
              theme: { ...selected.theme, fontFamily: prev.theme.fontFamily },
              selectedPreset: presetName,
            }
          : prev
      );
    }
  };

  const categories = catalogData?.categories || [];

  const tocEntries = useMemo(() => {
    if (!categories || categories.length === 0 || !initialOptions) return [];
    const productsPerRow = initialOptions.productColumns;
    const rowsPerPage = 5;
    const PRODUCTS_PER_PAGE = productsPerRow * rowsPerPage;
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
  }, [categories, initialOptions]);

  const documentProps = useMemo<CatalogDocumentProps | null>(() => {
    if (!initialOptions) return null;
    return {
      categories,
      info: initialOptions.info,
      theme: initialOptions.theme,
      tocEntries,
      coverLayout: initialOptions.coverLayout,
      productColumns: initialOptions.productColumns,
      priceDisplay: initialOptions.priceDisplay,
      isPreviewMode,
    };
  }, [categories, initialOptions, tocEntries, isPreviewMode]);

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
    link.download = `${catalogData?.catalogName || "Catalog"}_${initialOptions?.info.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, catalogData?.catalogName, initialOptions, isPreviewMode]);

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
        label: catalogData?.catalogName
          ? catalogData.catalogName
          : "Loading...",
        isActive: true,
      },
    ]);
  }, [catalogData, setBreadcrumbs]);

  if (isFetchingData || !currentOptions)
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
      <aside className="w-[420px] h-full flex-shrink-0 relative">
        <Card className="h-full rounded-none border-0 border-r flex flex-col">
          <CardHeader>
            <CardTitle>Catalog Editor</CardTitle>
            <CardDescription>{catalogData?.catalogName}</CardDescription>
          </CardHeader>
          <div className="px-6 py-4 border-b border-t bg-amber-100 border-amber-200">
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
                disabled={isFetchingData || isWorkerLoading}
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
                      value={currentOptions.coverLayout}
                      onValueChange={(value: CoverLayout) =>
                        setCurrentOptions((prev) =>
                          prev ? { ...prev, coverLayout: value } : prev
                        )
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
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="price">Pricing Mode</Label>
                    <Select
                      value={currentOptions.priceDisplay}
                      onValueChange={(value: TypePriceDisplay) =>
                        setCurrentOptions((prev) =>
                          prev ? { ...prev, priceDisplay: value } : prev
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key={"wholesale"} value={"wholesale_price"}>
                          Wholesale Price
                        </SelectItem>
                        <SelectItem key={"Retail"} value={"retail_price"}>
                          Retail Price
                        </SelectItem>
                        <SelectItem key={"none"} value={"none"}>
                          No Price
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="product-columns">Products per Row</Label>
                    <Select
                      value={String(currentOptions.productColumns)}
                      onValueChange={(value) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? { ...prev, productColumns: Number(value) }
                            : prev
                        )
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
                  {/* <div className="grid w-full items-center gap-1.5">
                    <Label>Logo Upload</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleLogoUpload}
                      className="pt-1.5"
                    />
                  </div> */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={currentOptions.info.name}
                      onChange={(e) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                info: { ...prev.info, name: e.target.value },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="tagline">Catalog Tagline</Label>
                    <Input
                      id="tagline"
                      type="text"
                      value={currentOptions.info.tagline}
                      onChange={(e) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                info: { ...prev.info, tagline: e.target.value },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="text"
                      value={currentOptions.info.year}
                      onChange={(e) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                info: { ...prev.info, year: e.target.value },
                              }
                            : prev
                        )
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
                      value={currentOptions.selectedPreset}
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
                        value={currentOptions.theme.fontFamily.heading}
                        onValueChange={(val) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  theme: {
                                    ...prev.theme,
                                    fontFamily: {
                                      ...prev.theme.fontFamily,
                                      heading: val,
                                    },
                                  },
                                }
                              : prev
                          )
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
                        value={currentOptions.theme.fontFamily.body}
                        onValueChange={(val) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  theme: {
                                    ...prev.theme,
                                    fontFamily: {
                                      ...prev.theme.fontFamily,
                                      body: val,
                                    },
                                  },
                                }
                              : prev
                          )
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
                        value={currentOptions.theme.cover.primaryColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    cover: {
                                      ...prev.theme.cover,
                                      primaryColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Secondary</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.cover.secondaryColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    cover: {
                                      ...prev.theme.cover,
                                      secondaryColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Background</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.cover.backgroundColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    cover: {
                                      ...prev.theme.cover,
                                      backgroundColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Text</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.cover.textColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    cover: {
                                      ...prev.theme.cover,
                                      textColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-xs text-muted-foreground">
                    TABLE OF CONTENTS COLORS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label>Header</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.toc.headerColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    toc: {
                                      ...prev.theme.toc,
                                      headerColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Page Number</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.toc.pageNumberColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    toc: {
                                      ...prev.theme.toc,
                                      pageNumberColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Border</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.toc.borderColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    toc: {
                                      ...prev.theme.toc,
                                      borderColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Text</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.toc.textColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    toc: {
                                      ...prev.theme.toc,
                                      textColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
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
                        value={
                          currentOptions.theme.content
                            .categoryHeaderBackgroundColor
                        }
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    content: {
                                      ...prev.theme.content,
                                      categoryHeaderBackgroundColor:
                                        e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Category Text</Label>
                      <Input
                        type="color"
                        value={
                          currentOptions.theme.content.categoryHeaderTextColor
                        }
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    content: {
                                      ...prev.theme.content,
                                      categoryHeaderTextColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Price</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.content.productPriceColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    content: {
                                      ...prev.theme.content,
                                      productPriceColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Body Text</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.content.textColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    content: {
                                      ...prev.theme.content,
                                      textColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Page Background</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.content.backgroundColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    content: {
                                      ...prev.theme.content,
                                      backgroundColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
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
                        value={currentOptions.theme.backCover.primaryColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    backCover: {
                                      ...prev.theme.backCover,
                                      primaryColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Text</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.backCover.textColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    backCover: {
                                      ...prev.theme.backCover,
                                      textColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                        className="p-1 h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Background</Label>
                      <Input
                        type="color"
                        value={currentOptions.theme.backCover.backgroundColor}
                        onChange={(e) =>
                          setCurrentOptions((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedPreset: "",
                                  theme: {
                                    ...prev.theme,
                                    backCover: {
                                      ...prev.theme.backCover,
                                      backgroundColor: e.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
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
                      value={currentOptions.info.phone}
                      onChange={(e) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                info: { ...prev.info, phone: e.target.value },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentOptions.info.email}
                      onChange={(e) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                info: { ...prev.info, email: e.target.value },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="text"
                      value={currentOptions.info.website}
                      onChange={(e) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                info: { ...prev.info, website: e.target.value },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={currentOptions.info.address}
                      onChange={(e) =>
                        setCurrentOptions((prev) =>
                          prev
                            ? {
                                ...prev,
                                info: { ...prev.info, address: e.target.value },
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          {categories.length > 0 && (
            <CardFooter className="pt-4 border-t flex-col items-start gap-4">
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
              <div className="w-full flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={
                    isFetchingData || isWorkerLoading || !isDirty || isSaving
                  }
                  className="flex-grow"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={!isDirty || isSaving}
                  variant="outline"
                >
                  <XCircle size={16} className="mr-2" />
                  Cancel
                </Button>
              </div>
              <Button
                onClick={handleDownload}
                disabled={isWorkerLoading || !pdfUrl}
                className="w-full mt-2"
              >
                {isWorkerLoading && isPreviewMode ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Updating Preview...
                  </>
                ) : isWorkerLoading && !isPreviewMode ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2 text" />
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
        {(isWorkerLoading || isFetchingData || isSaving) && (
          <div className="absolute inset-0 dark:bg-white/50 bg-accent-foreground/50 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="dark:text-muted text-muted-foreground font-medium">
              {isFetchingData
                ? "Fetching Data..."
                : isSaving
                  ? "Saving..."
                  : "Generating Pdf..."}
            </p>
          </div>
        )}
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
