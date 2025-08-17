"use client";

// --- STEP 1: Imports for Supabase, react-pdf, UI libraries, and shadcn components ---
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  PDFViewer,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import type { Database } from "@/interface/database.types";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/supabase";
import { getImageUrl } from "@/lib/GetImageUrl";

// --- TYPES ---
type Product = Database["public"]["Tables"]["item"]["Row"];
type Category = Database["public"]["Tables"]["item_category"]["Row"];
interface CategoryWithProducts extends Category {
  products: Product[];
}
interface CompanyInfo {
  name: string;
  tagline: string;
  year: string;
  logoUrl: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}
interface Theme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}
type TocEntry = { name: string; page: number };

// --- HOOK for Debouncing (Performance) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- UTILITY ---
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size)
    result.push(array.slice(i, i + size));
  return result;
};
const PRODUCTS_PER_PAGE = 9;
const PLACEHOLDER_IMAGE =
  "https://www.prokerala.com/images/shop/placeholder.png";

// --- DATA FETCHING (Unchanged) ---
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
    .in("item_id", itemIds);
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

// --- FONT REGISTRATION ---
Font.register({
  family: "Helvetica-Bold",
  src: `https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf`,
});

// --- PDF STYLESHEET (Unchanged) ---
const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 30 },
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 15,
    right: 30,
    color: "#6B7280",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: "32%",
    flexDirection: "column",
    marginBottom: 15,
    position: "relative",
  },
  productImageContainer: {
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginBottom: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: { width: "80%", height: "80%", objectFit: "contain" },
  productName: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  productDescription: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 3,
    height: 20,
  },
  productPrice: { fontSize: 9, marginTop: "auto", paddingTop: 4 },
  productIdBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
    padding: "2px 4px",
    borderRadius: 3,
    fontSize: 6,
  },
  coverPage: { padding: 0 },
  coverArt: { position: "absolute", width: "100%", height: "100%" },
  coverBlackShape: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    clipPath: "polygon(0 0, 70% 0, 30% 100%, 0 100%)",
  },
  coverContent: {
    position: "absolute",
    top: 60,
    left: 40,
    right: 40,
    bottom: 40,
    flexDirection: "column",
  },
  coverDiamond: {
    position: "absolute",
    top: "15%",
    left: "25%",
    width: 250,
    height: 250,
    transform: "rotate(45deg)",
    borderRadius: 40,
  },
  coverMainText: { position: "absolute", bottom: 120, left: 0 },
  coverTitle: { fontFamily: "Helvetica-Bold", fontSize: 28 },
  coverNewColl: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    padding: "4 8",
    borderRadius: 4,
    marginTop: 15,
  },
  coverYear: {
    position: "absolute",
    bottom: 0,
    right: 0,
    fontFamily: "Helvetica-Bold",
  },
  coverContact: {
    position: "absolute",
    bottom: 0,
    left: 0,
    flexDirection: "row",
    gap: 15,
    fontSize: 8,
  },
  tocPage: { padding: 40 },
  tocHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid",
    paddingBottom: 10,
  },
  tocTitle: { fontSize: 24, fontFamily: "Helvetica-Bold" },
  tocEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottom: "1px dotted #9CA3AF",
  },
  catHeaderPage: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  catHeaderTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    textAlign: "center",
  },
  catHeaderTag: {
    position: "absolute",
    bottom: 40,
    right: 40,
    padding: "10 20",
    borderRadius: 5,
  },
  backCoverPage: { padding: 0 },
  backCoverContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  backContactItem: { flexDirection: "row", alignItems: "center", gap: 10 },
});

// --- THE PDF DOCUMENT COMPONENT (Updated with Image Safety) ---
interface CatalogDocumentProps {
  categories: CategoryWithProducts[];
  info: CompanyInfo;
  theme: Theme;
  tocEntries: TocEntry[];
}
const CatalogDocument: React.FC<CatalogDocumentProps> = ({
  categories,
  info,
  theme,
  tocEntries,
}) => {
  return (
    <Document author={info.name} title={`${info.tagline} Catalog ${info.year}`}>
      {/* Cover Page */}
      <Page
        size="A4"
        style={[styles.coverPage, { backgroundColor: theme.backgroundColor }]}
      >
        <View style={styles.coverArt} fixed>
          <View
            style={[
              styles.coverBlackShape,
              { backgroundColor: theme.secondaryColor },
            ]}
          />
          <View
            style={[
              styles.coverDiamond,
              { backgroundColor: theme.primaryColor, left: "30%" },
            ]}
          />
        </View>
        <View style={styles.coverContent}>
          {info.logoUrl && (
            <Image
              src={info.logoUrl}
              style={{
                width: 200,
                height: 300,
                objectFit: "contain",
                alignSelf: "flex-end",
              }}
            />
          )}
          <View style={styles.coverMainText}>
            <Text style={[styles.coverTitle, { color: theme.textColor }]}>
              {info.tagline}
            </Text>
            <Text style={[styles.coverTitle, { color: theme.primaryColor }]}>
              PRODUCT CATALOG
            </Text>
            <View
              style={[
                styles.coverNewColl,
                { backgroundColor: theme.primaryColor },
              ]}
            >
              <Text style={{ color: theme.secondaryColor }}>
                NEW COLLECTION
              </Text>
            </View>
          </View>
          <Text style={[styles.coverYear, { color: theme.textColor }]}>
            {info.year}
          </Text>
          <View style={[styles.coverContact, { color: theme.textColor }]}>
            <Text>{info.phone}</Text>
            <Text>{info.email}</Text>
          </View>
        </View>
      </Page>
      {/* TOC */}
      <Page
        size="A4"
        style={[styles.tocPage, { backgroundColor: theme.backgroundColor }]}
      >
        <View
          style={[
            styles.tocHeader,
            { borderBottomColor: theme.secondaryColor },
          ]}
        >
          <Text style={[styles.tocTitle, { color: theme.secondaryColor }]}>
            TABLE OF CONTENTS
          </Text>
          {info.logoUrl && (
            <Image
              src={info.logoUrl}
              style={{ width: 80, height: 30, objectFit: "contain" }}
            />
          )}
        </View>
        <View style={{ marginTop: 30, color: theme.textColor }}>
          {tocEntries.map((entry: TocEntry) => (
            <View key={entry.name} style={styles.tocEntry}>
              <Text style={{ fontSize: 11 }}>{entry.name}</Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Helvetica-Bold",
                  color: theme.primaryColor,
                }}
              >
                {entry.page}
              </Text>
            </View>
          ))}
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
      {/* Categories & Products */}
      {categories.map((category: CategoryWithProducts) => {
        const productChunks = chunkArray(category.products, PRODUCTS_PER_PAGE);
        return (
          <React.Fragment key={category.category_id}>
            <Page
              size="A4"
              style={[
                styles.catHeaderPage,
                { backgroundColor: `${theme.primaryColor}20` },
              ]}
              break
            >
              <Text
                style={[styles.catHeaderTitle, { color: theme.secondaryColor }]}
              >
                {category.name.toUpperCase()}
              </Text>
              <View
                style={[
                  styles.catHeaderTag,
                  { backgroundColor: theme.secondaryColor },
                ]}
              >
                <Text style={{ color: "white" }}>COLLECTION</Text>
              </View>
              <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) =>
                  `${pageNumber} / ${totalPages}`
                }
                fixed
              />
            </Page>
            {productChunks.map((chunk, chunkIndex) => (
              <Page
                key={chunkIndex}
                size="A4"
                style={[
                  styles.page,
                  { backgroundColor: theme.backgroundColor },
                ]}
              >
                <View style={styles.productGrid}>
                  {chunk.map((product: Product) => (
                    <View
                      key={product.item_id}
                      style={styles.productCard}
                      wrap={false}
                    >
                      <View style={styles.productImageContainer}>
                        <Image
                          src={
                            getImageUrl(product.image_url) || PLACEHOLDER_IMAGE
                          }
                          style={styles.productImage}
                        />
                      </View>
                      <Text
                        style={[styles.productName, { color: theme.textColor }]}
                      >
                        {product.name}
                      </Text>
                      <Text style={styles.productDescription}>
                        {product.description}
                      </Text>
                      <Text
                        style={[
                          styles.productPrice,
                          { color: theme.primaryColor },
                        ]}
                      >
                        ${product.retail_price.toFixed(2)}
                      </Text>
                      <Text style={styles.productIdBadge}>
                        #{product.item_id}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text
                  style={styles.pageNumber}
                  render={({ pageNumber, totalPages }) =>
                    `${pageNumber} / ${totalPages}`
                  }
                  fixed
                />
              </Page>
            ))}
          </React.Fragment>
        );
      })}
      {/* Back Cover */}
      <Page
        size="A4"
        style={[
          styles.backCoverPage,
          { backgroundColor: theme.secondaryColor },
        ]}
      >
        <View style={styles.coverArt} fixed>
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              height: "100%",
              backgroundColor: theme.backgroundColor,
              clipPath: "polygon(70% 0, 100% 0, 100% 100%, 30% 100%)",
            }}
          />
        </View>
        <View style={styles.backCoverContent}>
          {info.logoUrl && (
            <Image
              src={info.logoUrl}
              style={{ width: 120, height: 50, objectFit: "contain" }}
            />
          )}
          <View style={{ alignItems: "center", gap: 5 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14 }}>
              GET IN TOUCH
            </Text>
            <Text>Let's talk about your next project.</Text>
          </View>
          <View style={{ gap: 8, fontSize: 10 }}>
            <View style={styles.backContactItem}>
              <Text>P: {info.phone}</Text>
            </View>
            <View style={styles.backContactItem}>
              <Text>E: {info.email}</Text>
            </View>
            <View style={styles.backContactItem}>
              <Text>W: {info.website}</Text>
            </View>
            <View style={styles.backContactItem}>
              <Text>A: {info.address}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// --- MAIN COMPONENT with Sidebar, Debouncing, and Loading Indicator ---
export function CatalogBuilder({ catalogId }: { catalogId: number }) {
  // State for immediate UI updates
  const [info, setInfo] = useState<CompanyInfo>({
    name: "Your Company",
    tagline: "MULTIPURPOSE",
    year: "2023-2025",
    logoUrl: "",
    phone: "+1 234 567 8900",
    email: "info@company.com",
    website: "www.company.com",
    address: "123 Business St, City, State 12345",
  });
  const [theme, setTheme] = useState<Theme>({
    primaryColor: "#f5b50b",
    secondaryColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
  });

  // Debounced state that will be passed to the PDF renderer
  const debouncedInfo = useDebounce(info, 500);
  const debouncedTheme = useDebounce(theme, 500);
  const [isRerendering, setIsRerendering] = useState(false);

  const {
    data: catalogData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["catalogData", catalogId],
    queryFn: () => fetchCatalogData(catalogId),
    enabled: !!catalogId,
  });
  const categories = catalogData?.categories;

  // Effect to trigger the "Updating Preview..." indicator
  useEffect(() => {
    setIsRerendering(true);
    const timer = setTimeout(() => setIsRerendering(false), 1000); // Hide after a delay
    return () => clearTimeout(timer);
  }, [debouncedInfo, debouncedTheme]);

  const tocEntries = useMemo(() => {
    if (!categories) return [];
    const entries: TocEntry[] = [];
    let pageCounter = 2;
    categories.forEach((category) => {
      pageCounter++;
      entries.push({ name: category.name, page: pageCounter });
      pageCounter += Math.ceil(category.products.length / PRODUCTS_PER_PAGE);
    });
    return entries;
  }, [categories]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
        <p className="ml-4 text-lg">Fetching Catalog & Building PDF...</p>
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

  return (
    <div className="flex h-[calc(100vh-75px)] font-sans bg-muted/40">
      {/* Sidebar Editor */}
      <aside className="w-[380px] h-full flex-shrink-0">
        <Card className="h-full rounded-none border-0 border-r overflow-y-auto">
          <CardHeader>
            <CardTitle>Catalog Editor</CardTitle>
            <CardDescription>{catalogData?.catalogName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Company Info</h3>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="text"
                  placeholder="https://path.to/logo.png"
                  value={info.logoUrl}
                  onChange={(e) =>
                    setInfo((i) => ({ ...i, logoUrl: e.target.value }))
                  }
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
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
              <div className="grid w-full items-center gap-1.5">
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
              <div className="grid w-full items-center gap-1.5">
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
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Theme & Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label>Primary</Label>
                  <Input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) =>
                      setTheme((t) => ({ ...t, primaryColor: e.target.value }))
                    }
                    className="p-1 h-10"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label>Secondary</Label>
                  <Input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) =>
                      setTheme((t) => ({
                        ...t,
                        secondaryColor: e.target.value,
                      }))
                    }
                    className="p-1 h-10"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label>Background</Label>
                  <Input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) =>
                      setTheme((t) => ({
                        ...t,
                        backgroundColor: e.target.value,
                      }))
                    }
                    className="p-1 h-10"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label>Text</Label>
                  <Input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) =>
                      setTheme((t) => ({ ...t, textColor: e.target.value }))
                    }
                    className="p-1 h-10"
                  />
                </div>
              </div>
            </div>
            {categories && (
              <Button asChild className="w-full">
                <PDFDownloadLink
                  document={
                    <CatalogDocument
                      categories={categories}
                      info={debouncedInfo}
                      theme={debouncedTheme}
                      tocEntries={tocEntries}
                    />
                  }
                  fileName={`${catalogData?.catalogName || "Catalog"}_${info.year}.pdf`}
                >
                  {({ loading }) =>
                    loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" /> Download PDF
                      </>
                    )
                  }
                </PDFDownloadLink>
              </Button>
            )}
          </CardContent>
        </Card>
      </aside>

      {/* PDF Viewer with Loading Overlay */}
      <main className="flex-grow h-full p-4 relative">
        {isRerendering && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground font-medium">
              Updating Preview...
            </p>
          </div>
        )}
        <div className="w-full h-full rounded-md border overflow-hidden">
          {categories ? (
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <CatalogDocument
                categories={categories}
                info={debouncedInfo}
                theme={debouncedTheme}
                tocEntries={tocEntries}
              />
            </PDFViewer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <p className="text-muted-foreground">
                No items found for this catalog.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
