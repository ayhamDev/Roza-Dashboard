/* eslint-disable no-restricted-globals */
/* eslint-disable no-eval */
/* eslint-disable @typescript-eslint/no-unused-vars */

// --- SHIMS FOR REACT FAST REFRESH IN WEB WORKER ---
(window as any).$RefreshReg$ = () => {
  /**/
};
(window as any).$RefreshSig$ = () => () => {
  /**/
};
// --- END SHIMS ---

import React from "react";
import {
  Circle,
  Document,
  Font,
  Image,
  Line,
  Link,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Database } from "@/interface/database.types"; // Adjust path as needed
import { getImageUrl } from "@/lib/GetImageUrl"; // Adjust path as needed
import Logo from "@/assets/logo.png";

// --- TYPES ---
type Product = Database["public"]["Tables"]["item"]["Row"];
type Category = Database["public"]["Tables"]["item_category"]["Row"];

export interface CategoryWithProducts extends Category {
  products: Product[];
}
export interface CompanyInfo {
  name: string;
  tagline: string;
  year: string;
  logoUrl: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

// --- NEW GRANULAR THEME TYPE ---
export interface Theme {
  fontFamily: {
    heading: string;
    body: string;
  };
  cover: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  toc: {
    headerColor: string;
    pageNumberColor: string;
    borderColor: string;
    textColor: string;
  };
  content: {
    categoryHeaderBackgroundColor: string;
    categoryHeaderTextColor: string;
    productPriceColor: string;
    backgroundColor: string;
    textColor: string;
  };
  backCover: {
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
  };
}

export type TocEntry = { name: string; page: number };

export type CoverLayout =
  | "corporate-minimalist"
  | "bold-geometric"
  | "centered-focus"
  | "elegant-overlay"
  | "header-footer"
  | "circular-motif"
  | "grid-lines"
  | "vertical-banner"
  | "typography-focus"
  | "framed-border"
  | "diagonal-split"
  | "image-collage"
  | "minimalist-arc"
  | "offset-blocks"
  | "color-wave"
  | "logo-showcase";

export const CoverLayouts: CoverLayout[] = [
  "corporate-minimalist",
  "bold-geometric",
  "centered-focus",
  "elegant-overlay",
  "header-footer",
  "circular-motif",
  "grid-lines",
  "vertical-banner",
  "typography-focus",
  "framed-border",
  "diagonal-split",
  "image-collage",
  "minimalist-arc",
  "offset-blocks",
  "color-wave",
  "logo-showcase",
];

export interface CatalogDocumentProps {
  categories: CategoryWithProducts[];
  info: CompanyInfo;
  theme: Theme;
  tocEntries: TocEntry[];
  coverLayout: CoverLayout;
}

// --- CONSTANTS & UTILITIES ---
const PRODUCTS_PER_PAGE = 9;
const PLACEHOLDER_IMAGE =
  "https://www.prokerala.com/images/shop/placeholder.png";
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// --- FONT REGISTRATION ---
Font.register({
  family: "Helvetica",
  src: `https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf`,
});
Font.register({
  family: "Helvetica-Bold",
  src: `https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf`,
});
Font.register({
  family: "Times-Roman",
  src: `https://github.com/MrRio/jsPDF/raw/master/src/core/fonts/Times-Roman.ttf`,
});
Font.register({
  family: "Courier",
  src: `https://github.com/MrRio/jsPDF/raw/master/src/core/fonts/Courier.ttf`,
});

// --- DYNAMIC STYLESHEET ---
const getStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      fontFamily: theme.fontFamily.body,
      fontSize: 9,
      padding: 30,
      backgroundColor: theme.content.backgroundColor,
    },
    pageNumber: {
      position: "absolute",
      fontSize: 12,
      bottom: 30,
      right: 30,
      color: "#9CA3AF",
      fontFamily: theme.fontFamily.body,
    },
    largeLogo: {
      width: 180,
      height: 180,
      objectFit: "contain",
      alignSelf: "center",
    },
    hugeLogo: {
      width: 400,
      height: 400,
      objectFit: "contain",
      alignSelf: "center",
      opacity: 0.1,
    },

    // --- Cover Layouts ---
    corpMinPage: { flexDirection: "row", padding: 0 },
    corpMinSidebar: {
      width: "40%",
      height: "100%",
      padding: 40,
      justifyContent: "space-between",
    },
    corpMinMain: {
      width: "60%",
      height: "100%",
      padding: 40,
      justifyContent: "center",
    },
    corpMinLogo: { width: 150, height: 60, objectFit: "contain" },
    corpMinTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 42,
      lineHeight: 1.2,
    },
    boldGeoPage: { padding: 0 },
    boldGeoContent: {
      position: "absolute",
      top: 40,
      left: 40,
      right: 40,
      bottom: 40,
      flexDirection: "column",
    },
    boldGeoLogo: { width: 150, height: 60, objectFit: "contain" },
    boldGeoFooter: { marginTop: "auto" },
    boldGeoTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 36,
      lineHeight: 1.2,
      color: "white",
    },
    boldGeoSub: {
      fontSize: 10,
      color: "white",
      letterSpacing: 2,
      marginTop: 10,
      fontFamily: theme.fontFamily.body,
    },
    centeredFocusPage: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    centeredFocusTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      letterSpacing: 3,
      marginBottom: 20,
    },
    centeredFocusSub: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 32,
      marginTop: 30,
      textAlign: "center",
    },
    centeredFocusYear: {
      fontSize: 12,
      marginTop: 8,
      fontFamily: theme.fontFamily.body,
    },
    elegantOverlayPage: { padding: 0 },
    elegantOverlayContent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    elegantOverlayBox: { width: "80%", padding: 30, alignItems: "center" },
    elegantOverlayLogo: { width: 200, height: 80, objectFit: "contain" },
    elegantOverlayTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      marginTop: 20,
      color: "white",
      textAlign: "center",
    },
    elegantOverlayYear: {
      fontSize: 12,
      marginTop: 5,
      color: "white",
      opacity: 0.8,
      fontFamily: theme.fontFamily.body,
    },
    headerFooterPage: { padding: 0, flexDirection: "column" },
    headerFooterHeader: { padding: 40 },
    headerFooterMain: {
      flex: 1,
      padding: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    headerFooterFooter: {
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-around",
      fontSize: 9,
      fontFamily: theme.fontFamily.body,
    },
    headerFooterTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 52,
      textAlign: "center",
    },
    headerFooterLogo: { width: 140, height: 50, objectFit: "contain" },
    circularMotifPage: { padding: 0 },
    circularMotifContent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 40,
      justifyContent: "space-between",
    },
    circularMotifLogo: { width: 120, height: 45, objectFit: "contain" },
    circularMotifMain: {
      position: "absolute",
      top: "50%",
      left: 40,
      transform: "translateY(-50%)",
    },
    circularMotifTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 40,
    },
    circularMotifSub: {
      fontSize: 14,
      letterSpacing: 1,
      marginTop: 5,
      fontFamily: theme.fontFamily.body,
    },
    gridLinesPage: { padding: 40 },
    gridLinesContent: {
      position: "absolute",
      top: 40,
      left: 40,
      right: 40,
      bottom: 40,
      justifyContent: "center",
    },
    gridLinesTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 64,
      position: "absolute",
      top: 0,
      left: 0,
    },
    gridLinesLogo: {
      width: 180,
      height: 70,
      objectFit: "contain",
      position: "absolute",
      bottom: 0,
      right: 0,
    },
    gridLinesYear: {
      position: "absolute",
      bottom: 0,
      left: 0,
      fontSize: 12,
      fontFamily: theme.fontFamily.body,
    },
    vertBannerPage: { flexDirection: "row", padding: 0 },
    vertBannerSidebar: {
      width: "35%",
      height: "100%",
      padding: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    vertBannerMain: { flex: 1, padding: 60, justifyContent: "center" },
    vertBannerLogo: { width: 150, height: 150, objectFit: "contain" },
    vertBannerTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 44,
      lineHeight: 1.1,
    },
    vertBannerSub: {
      fontSize: 12,
      marginTop: 20,
      fontFamily: theme.fontFamily.body,
    },
    typoFocusPage: { padding: 40, justifyContent: "center" },
    typoFocusText: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 88,
      lineHeight: 0.9,
      textAlign: "center",
    },
    typoFocusLogoContainer: {
      position: "absolute",
      top: 40,
      alignSelf: "center",
    },
    typoFocusLogo: { width: 150, height: 60, objectFit: "contain" },
    typoFocusFooter: {
      position: "absolute",
      bottom: 40,
      alignSelf: "center",
      fontSize: 10,
      textAlign: "center",
      fontFamily: theme.fontFamily.body,
    },
    framedBorderPage: { padding: 40 },
    framedBorderContent: {
      flex: 1,
      borderWidth: 2,
      padding: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    framedBorderTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 36,
      marginTop: 20,
      textAlign: "center",
    },
    framedBorderSub: {
      fontSize: 12,
      marginTop: 8,
      fontFamily: theme.fontFamily.body,
    },
    diagSplitPage: { padding: 0 },
    diagSplitContent: {
      position: "absolute",
      top: 40,
      left: 40,
      right: 40,
      bottom: 40,
      flexDirection: "column",
      justifyContent: "space-between",
    },
    diagSplitLogo: {
      width: 160,
      height: 65,
      objectFit: "contain",
      alignSelf: "flex-end",
    },
    diagSplitTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 48,
      color: "white",
      maxWidth: "50%",
    },
    collagePage: { padding: 0, flexDirection: "row" },
    collageLeft: { width: "65%", height: "100%" },
    collageRight: { width: "35%", height: "100%", flexDirection: "column" },
    collageBlock: { flex: 1 },
    collageContent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    collageLogo: { width: 220, height: 90, objectFit: "contain" },
    collageTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      color: "white",
      marginTop: 15,
      letterSpacing: 2,
    },
    minArcPage: { padding: 0 },
    minArcContent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 40,
    },
    minArcLogo: {
      width: 150,
      height: 60,
      objectFit: "contain",
      marginBottom: "auto",
    },
    minArcTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 40,
      maxWidth: "60%",
    },
    minArcYear: {
      position: "absolute",
      bottom: 40,
      right: 40,
      fontFamily: theme.fontFamily.heading,
      fontSize: 32,
    },
    offsetBlocksPage: { padding: 0 },
    offsetBlocksContent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    offsetBlocksLogo: { width: 250, height: 100, objectFit: "contain" },
    offsetBlocksTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      marginTop: 20,
    },
    wavePage: { padding: 0 },
    waveContent: {
      position: "absolute",
      top: 40,
      left: 40,
      right: 40,
      bottom: 40,
      alignItems: "center",
    },
    waveLogo: { width: 180, height: 70, objectFit: "contain" },
    waveTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 36,
      color: "white",
      marginTop: "auto",
      marginBottom: 20,
      textAlign: "center",
    },
    waveYear: {
      fontSize: 12,
      color: "white",
      opacity: 0.8,
      fontFamily: theme.fontFamily.body,
    },
    logoShowcasePage: { padding: 40, justifyContent: "space-between" },
    logoShowcaseTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logoShowcaseLogo: { width: 120, height: 45, objectFit: "contain" },
    logoShowcaseTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 48,
      textAlign: "right",
    },

    // --- Back Cover ---
    backCover: { padding: 0, flexDirection: "column" },
    backCoverColorBlock: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
      backgroundColor: theme.backCover.primaryColor,
    },
    backCoverWhiteBlock: {
      height: "35%",
      padding: 40,
      justifyContent: "center",
      backgroundColor: theme.backCover.backgroundColor,
    },
    backLogo: {
      width: 200,
      height: 80,
      objectFit: "contain",
      marginBottom: 20,
    },
    backTagline: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 24,
      textAlign: "center",
      color: theme.backCover.textColor,
    },
    backContactGrid: { flexDirection: "row", justifyContent: "space-between" },
    backContactColumn: { flexDirection: "column", gap: 15, width: "48%" },
    backContactLabel: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 8,
      color: "#888888",
      marginBottom: 3,
    },
    backContactValue: { fontSize: 9, fontFamily: theme.fontFamily.body },

    // --- TOC & Category ---
    tocPage: {
      padding: 40,
      backgroundColor: theme.content.backgroundColor,
    },
    tocHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 2,
      paddingBottom: 10,
      borderBottomColor: theme.toc.headerColor,
    },
    tocTitle: {
      fontSize: 24,
      fontFamily: theme.fontFamily.heading,
      color: theme.toc.headerColor,
    },
    tocEntry: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.toc.borderColor,
    },
    tocEntryText: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      fontSize: 11,
      fontFamily: theme.fontFamily.body,
      color: theme.toc.textColor,
    },
    tocNumber: {
      fontFamily: theme.fontFamily.heading,
      width: 25,
      color: theme.toc.headerColor,
    },
    catHeaderPage: {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.content.categoryHeaderBackgroundColor,
    },
    catHeaderTitle: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 28,
      textAlign: "center",
      textTransform: "uppercase",
      color: theme.content.categoryHeaderTextColor,
    },

    // --- Product Grid & Card ---
    productGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    productCard: { width: "32%", flexDirection: "column", marginBottom: 15 },
    productImageContainer: {
      aspectRatio: 1,
      backgroundColor: "#F3F4F6",
      borderRadius: 4,
      marginBottom: 5,
      justifyContent: "center",
      alignItems: "center",
    },
    productImage: { width: "80%", height: "80%", objectFit: "contain" },
    productName: {
      fontFamily: theme.fontFamily.heading,
      fontSize: 8,
      color: theme.content.textColor,
    },
    productDescription: {
      fontSize: 7,
      color: "#6B7280",
      marginTop: 3,
      height: 20,
      fontFamily: theme.fontFamily.body,
    },
    productPrice: {
      fontSize: 9,
      marginTop: "auto",
      paddingTop: 4,
      fontFamily: theme.fontFamily.body,
      color: theme.content.productPriceColor,
    },
    productIdBadge: {
      position: "absolute",
      top: 5,
      right: 5,
      backgroundColor: "rgba(0,0,0,0.5)",
      color: "white",
      padding: "2px 4px",
      borderRadius: 3,
      fontSize: 6,
      fontFamily: theme.fontFamily.body,
    },
  });

// --- THE PDF DOCUMENT COMPONENT ---
export const CatalogDocument: React.FC<CatalogDocumentProps> = ({
  categories,
  info,
  theme,
  tocEntries,
  coverLayout,
}) => {
  const styles = getStyles(theme);

  const FrontCover = () => {
    switch (coverLayout) {
      case "corporate-minimalist":
        return (
          <Page size="A4" style={styles.corpMinPage}>
            <View
              style={[
                styles.corpMinSidebar,
                { backgroundColor: theme.cover.secondaryColor },
              ]}
            >
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.corpMinLogo}
              />
              <Text style={{ color: "white", fontSize: 10 }}>
                {info.website}
              </Text>
            </View>
            <View
              style={[
                styles.corpMinMain,
                { backgroundColor: theme.cover.backgroundColor },
              ]}
            >
              <Text
                style={[styles.corpMinTitle, { color: theme.cover.textColor }]}
              >
                {info.tagline.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.corpMinTitle,
                  { color: theme.cover.primaryColor },
                ]}
              >
                PRODUCT CATALOG {info.year}
              </Text>
            </View>
          </Page>
        );
      case "bold-geometric":
        return (
          <Page size="A4" style={styles.boldGeoPage}>
            <Svg
              width="595"
              height="842"
              style={{ position: "absolute" }}
              fixed
            >
              <Rect
                x="0"
                y="0"
                width="595"
                height="842"
                fill={theme.cover.backgroundColor}
              />
              <Path
                d="M 0 0 L 595 0 L 595 600 L 0 842 Z"
                fill={theme.cover.secondaryColor}
              />
              <Path
                d="M 0 0 L 595 400 L 595 0 Z"
                fill={theme.cover.primaryColor}
              />
            </Svg>
            <View style={styles.boldGeoContent}>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.boldGeoLogo}
              />
              <View style={styles.boldGeoFooter}>
                <Text style={styles.boldGeoTitle}>
                  {info.tagline.toUpperCase()}
                </Text>
                <Text style={styles.boldGeoSub}>
                  PRODUCT CATALOG {info.year}
                </Text>
              </View>
            </View>
          </Page>
        );
      case "centered-focus":
        return (
          <Page
            size="A4"
            style={[
              styles.centeredFocusPage,
              { backgroundColor: theme.cover.backgroundColor },
            ]}
          >
            <Text
              style={[
                styles.centeredFocusTitle,
                { color: theme.cover.secondaryColor },
              ]}
            >
              {info.name.toUpperCase()}
            </Text>
            <Image
              cache={true}
              src={info.logoUrl || `${location.origin}${Logo}`}
              style={styles.largeLogo}
            />
            <Text
              style={[
                styles.centeredFocusSub,
                { color: theme.cover.textColor },
              ]}
            >
              {info.tagline.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.centeredFocusYear,
                { color: theme.cover.primaryColor },
              ]}
            >
              PRODUCT CATALOG {info.year}
            </Text>
          </Page>
        );
      case "elegant-overlay":
        return (
          <Page size="A4" style={styles.elegantOverlayPage}>
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: theme.cover.secondaryColor,
              }}
              fixed
            />
            <View style={styles.elegantOverlayContent}>
              <View
                style={[
                  styles.elegantOverlayBox,
                  { backgroundColor: "rgba(0,0,0,0.2)" },
                ]}
              >
                <Image
                  cache={true}
                  src={info.logoUrl || `${location.origin}${Logo}`}
                  style={styles.elegantOverlayLogo}
                />
                <Text style={styles.elegantOverlayTitle}>
                  {info.tagline.toUpperCase()}
                </Text>
                <Text style={styles.elegantOverlayYear}>
                  PRODUCT CATALOG {info.year}
                </Text>
              </View>
            </View>
          </Page>
        );
      case "header-footer":
        return (
          <Page
            size="A4"
            style={[
              styles.headerFooterPage,
              { backgroundColor: theme.cover.backgroundColor },
            ]}
          >
            <View
              style={[
                styles.headerFooterHeader,
                { backgroundColor: theme.cover.secondaryColor },
              ]}
            >
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.headerFooterLogo}
              />
            </View>
            <View style={styles.headerFooterMain}>
              <Text
                style={[
                  styles.headerFooterTitle,
                  { color: theme.cover.textColor },
                ]}
              >
                PRODUCT
              </Text>
              <Text
                style={[
                  styles.headerFooterTitle,
                  { color: theme.cover.primaryColor },
                ]}
              >
                CATALOG
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.cover.textColor,
                  marginTop: 10,
                  fontFamily: theme.fontFamily.body,
                }}
              >
                {info.year}
              </Text>
            </View>
            <View
              style={[
                styles.headerFooterFooter,
                { backgroundColor: theme.cover.secondaryColor, color: "white" },
              ]}
            >
              <Text>{info.phone}</Text>
              <Text>{info.email}</Text>
              <Text>{info.website}</Text>
            </View>
          </Page>
        );
      case "circular-motif":
        return (
          <Page
            size="A4"
            style={[
              styles.circularMotifPage,
              { backgroundColor: theme.cover.backgroundColor },
            ]}
          >
            <Svg
              width="595"
              height="842"
              style={{ position: "absolute" }}
              fixed
            >
              <Circle
                cx="450"
                cy="421"
                r="300"
                fill={theme.cover.secondaryColor}
              />
              <Circle
                cx="520"
                cy="150"
                r="100"
                fill={theme.cover.primaryColor}
              />
            </Svg>
            <View style={styles.circularMotifContent}>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.circularMotifLogo}
              />
              <View style={styles.circularMotifMain}>
                <Text
                  style={[
                    styles.circularMotifTitle,
                    { color: theme.cover.textColor },
                  ]}
                >
                  {info.tagline.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.circularMotifSub,
                    { color: theme.cover.primaryColor },
                  ]}
                >
                  PRODUCT CATALOG {info.year}
                </Text>
              </View>
            </View>
          </Page>
        );
      case "grid-lines":
        return (
          <Page
            size="A4"
            style={[
              styles.gridLinesPage,
              { backgroundColor: theme.cover.backgroundColor },
            ]}
          >
            <Svg
              width="595"
              height="842"
              style={{ position: "absolute" }}
              fixed
            >
              <Line
                x1="40"
                y1="200"
                x2="555"
                y2="200"
                stroke={theme.cover.primaryColor}
                strokeWidth="1"
              />
              <Line
                x1="150"
                y1="40"
                x2="150"
                y2="802"
                stroke={theme.cover.primaryColor}
                strokeWidth="1"
              />
            </Svg>
            <View style={styles.gridLinesContent}>
              <Text
                style={[
                  styles.gridLinesTitle,
                  { color: theme.cover.secondaryColor },
                ]}
              >
                {info.name.toUpperCase()}
              </Text>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.gridLinesLogo}
              />
              <Text
                style={[styles.gridLinesYear, { color: theme.cover.textColor }]}
              >
                {info.year} COLLECTION
              </Text>
            </View>
          </Page>
        );
      case "vertical-banner":
        return (
          <Page size="A4" style={styles.vertBannerPage}>
            <View
              style={[
                styles.vertBannerSidebar,
                { backgroundColor: theme.cover.primaryColor },
              ]}
            >
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.vertBannerLogo}
              />
            </View>
            <View
              style={[
                styles.vertBannerMain,
                { backgroundColor: theme.cover.backgroundColor },
              ]}
            >
              <Text
                style={[
                  styles.vertBannerTitle,
                  { color: theme.cover.secondaryColor },
                ]}
              >
                {info.name.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.vertBannerTitle,
                  { color: theme.cover.textColor },
                ]}
              >
                PRODUCT CATALOG
              </Text>
              <Text
                style={[styles.vertBannerSub, { color: theme.cover.textColor }]}
              >
                {info.year} {info.tagline} Collection
              </Text>
            </View>
          </Page>
        );
      case "typography-focus":
        return (
          <Page
            size="A4"
            style={[
              styles.typoFocusPage,
              { backgroundColor: theme.cover.backgroundColor },
            ]}
          >
            <View style={styles.typoFocusLogoContainer}>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.typoFocusLogo}
              />
            </View>
            <Text
              style={[
                styles.typoFocusText,
                { color: `${theme.cover.secondaryColor}20` },
              ]}
            >
              PRODUCT
            </Text>
            <Text
              style={[
                styles.typoFocusText,
                { color: theme.cover.primaryColor },
              ]}
            >
              CATALOG
            </Text>
            <View style={styles.typoFocusFooter}>
              <Text style={{ color: theme.cover.textColor }}>
                {info.name.toUpperCase()} / {info.year} COLLECTION
              </Text>
            </View>
          </Page>
        );
      case "framed-border":
        return (
          <Page
            size="A4"
            style={[
              styles.framedBorderPage,
              { backgroundColor: theme.cover.backgroundColor },
            ]}
          >
            <View
              style={[
                styles.framedBorderContent,
                { borderColor: theme.cover.secondaryColor },
              ]}
            >
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.largeLogo}
              />
              <Text
                style={[
                  styles.framedBorderTitle,
                  { color: theme.cover.textColor },
                ]}
              >
                {info.tagline.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.framedBorderSub,
                  { color: theme.cover.primaryColor },
                ]}
              >
                PRODUCT CATALOG / {info.year}
              </Text>
            </View>
          </Page>
        );
      case "diagonal-split":
        return (
          <Page size="A4" style={styles.diagSplitPage}>
            <Svg
              width="595"
              height="842"
              style={{ position: "absolute" }}
              fixed
            >
              <Path
                d="M 0 842 L 595 200 L 595 842 Z"
                fill={theme.cover.secondaryColor}
              />
              <Path
                d="M 0 0 L 595 0 L 595 190 L 0 832 Z"
                fill={theme.cover.backgroundColor}
              />
            </Svg>
            <View style={styles.diagSplitContent}>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.diagSplitLogo}
              />
              <Text style={styles.diagSplitTitle}>
                {info.tagline.toUpperCase()} {info.year}
              </Text>
            </View>
          </Page>
        );
      case "image-collage":
        return (
          <Page size="A4" style={styles.collagePage}>
            <View style={styles.collageLeft}>
              <View
                style={[
                  styles.collageBlock,
                  { backgroundColor: `${theme.cover.secondaryColor}40` },
                ]}
              ></View>
              <View
                style={[
                  styles.collageBlock,
                  { backgroundColor: `${theme.cover.secondaryColor}80` },
                ]}
              ></View>
            </View>
            <View style={styles.collageRight}>
              <View
                style={[
                  styles.collageBlock,
                  { backgroundColor: `${theme.cover.secondaryColor}60` },
                ]}
              ></View>
              <View
                style={[
                  styles.collageBlock,
                  { backgroundColor: `${theme.cover.secondaryColor}99` },
                ]}
              ></View>
              <View
                style={[
                  styles.collageBlock,
                  { backgroundColor: `${theme.cover.secondaryColor}30` },
                ]}
              ></View>
            </View>
            <View
              style={[
                styles.collageContent,
                { backgroundColor: `${theme.cover.primaryColor}dd` },
              ]}
            >
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.collageLogo}
              />
              <Text style={styles.collageTitle}>
                PRODUCT CATALOG {info.year}
              </Text>
            </View>
          </Page>
        );
      case "minimalist-arc":
        return (
          <Page
            size="A4"
            style={[
              styles.minArcPage,
              { backgroundColor: theme.cover.secondaryColor },
            ]}
          >
            <Svg
              width="595"
              height="842"
              style={{ position: "absolute" }}
              fixed
            >
              <Path
                d="M 595 842 C 300 842 0 400 0 0 L 595 0 Z"
                fill={theme.cover.backgroundColor}
              />
            </Svg>
            <View style={styles.minArcContent}>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.minArcLogo}
              />
              <View style={{ marginTop: "auto" }}>
                <Text
                  style={[styles.minArcTitle, { color: theme.cover.textColor }]}
                >
                  {info.tagline.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.minArcTitle,
                    {
                      color: theme.cover.primaryColor,
                      fontSize: 14,
                      marginTop: 10,
                      fontFamily: theme.fontFamily.body,
                    },
                  ]}
                >
                  PRODUCT CATALOG
                </Text>
              </View>
            </View>
            <Text style={[styles.minArcYear, { color: theme.cover.textColor }]}>
              {info.year}
            </Text>
          </Page>
        );
      case "offset-blocks":
        return (
          <Page size="A4" style={styles.offsetBlocksPage}>
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: theme.cover.backgroundColor,
              }}
              fixed
            />
            <View
              style={{
                position: "absolute",
                top: 40,
                left: 40,
                width: "70%",
                height: 300,
                backgroundColor: theme.cover.secondaryColor,
              }}
              fixed
            />
            <View
              style={{
                position: "absolute",
                bottom: 40,
                right: 40,
                width: "70%",
                height: 300,
                backgroundColor: theme.cover.primaryColor,
              }}
              fixed
            />
            <View
              style={[
                styles.offsetBlocksContent,
                { backgroundColor: "rgba(255, 255, 255, 0.8)" },
              ]}
            >
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.offsetBlocksLogo}
              />
              <Text
                style={[
                  styles.offsetBlocksTitle,
                  { color: theme.cover.textColor },
                ]}
              >
                PRODUCT CATALOG {info.year}
              </Text>
            </View>
          </Page>
        );
      case "color-wave":
        return (
          <Page size="A4" style={styles.wavePage}>
            <Svg
              width="595"
              height="842"
              style={{ position: "absolute" }}
              fixed
            >
              <Path
                d="M 0 0 L 595 0 L 595 842 L 0 842 Z"
                fill={theme.cover.backgroundColor}
              />
              <Path
                d="M 0 842 C 200 700 400 900 595 842 L 595 200 C 400 350 200 150 0 200 Z"
                fill={theme.cover.secondaryColor}
              />
            </Svg>
            <View style={styles.waveContent}>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.waveLogo}
              />
              <Text style={styles.waveTitle}>{info.tagline.toUpperCase()}</Text>
              <Text style={styles.waveYear}>PRODUCT CATALOG {info.year}</Text>
            </View>
          </Page>
        );
      case "logo-showcase":
        return (
          <Page
            size="A4"
            style={[
              styles.logoShowcasePage,
              { backgroundColor: theme.cover.backgroundColor },
            ]}
          >
            <View
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
              fixed
            >
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.hugeLogo}
              />
            </View>
            <View style={styles.logoShowcaseTop}>
              <Image
                cache={true}
                src={info.logoUrl || `${location.origin}${Logo}`}
                style={styles.logoShowcaseLogo}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: theme.fontFamily.body,
                  color: theme.cover.textColor,
                }}
              >
                {info.name.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text
                style={[
                  styles.logoShowcaseTitle,
                  { color: theme.cover.textColor },
                ]}
              >
                Product
              </Text>
              <Text
                style={[
                  styles.logoShowcaseTitle,
                  { color: theme.cover.primaryColor },
                ]}
              >
                Catalog {info.year}
              </Text>
            </View>
          </Page>
        );

      default:
        return (
          <Page>
            <Text>Select a cover layout</Text>
          </Page>
        );
    }
  };

  return (
    <Document author={info.name} title={`${info.tagline} Catalog ${info.year}`}>
      <FrontCover />

      {/* --- TABLE OF CONTENTS --- */}
      <Page size="A4" style={styles.tocPage}>
        <View style={styles.tocHeader}>
          <Text style={styles.tocTitle}>Contents</Text>
          {(info.logoUrl || `${location.origin}${Logo}`) && (
            <Image
              cache={true}
              src={info.logoUrl || `${location.origin}${Logo}`}
              style={{ width: 80, height: 30, objectFit: "contain" }}
            />
          )}
        </View>
        <View style={{ marginTop: 30 }}>
          {tocEntries.map((entry, index) => (
            <View key={entry.name} style={styles.tocEntry}>
              <View style={styles.tocEntryText}>
                <Text style={styles.tocNumber}>
                  {(index + 1).toString().padStart(2, "0")}
                </Text>
                <Text>{entry.name}</Text>
              </View>
              <Text
                style={{
                  fontFamily: theme.fontFamily.heading,
                  color: theme.toc.pageNumberColor,
                }}
              >
                {entry.page}
              </Text>
            </View>
          ))}
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => pageNumber}
          fixed
        />
      </Page>

      {/* --- Categories & Products --- */}
      {categories.map((category: CategoryWithProducts) => {
        const productChunks = chunkArray(category.products, PRODUCTS_PER_PAGE);
        return (
          <React.Fragment key={category.category_id}>
            <Page size="A4" style={styles.catHeaderPage} break>
              <Text style={styles.catHeaderTitle}>{category.name}</Text>
              <Text
                style={styles.pageNumber}
                render={({ pageNumber }) => pageNumber}
                fixed
              />
            </Page>
            {productChunks.map((chunk, chunkIndex) => (
              <Page key={chunkIndex} size="A4" style={styles.page}>
                <View style={styles.productGrid}>
                  {chunk.map((product) => (
                    <View
                      key={product.item_id}
                      style={styles.productCard}
                      wrap={false}
                    >
                      <View style={styles.productImageContainer}>
                        <Image
                          cache={true}
                          src={
                            getImageUrl(product.image_url) || PLACEHOLDER_IMAGE
                          }
                          style={styles.productImage}
                        />
                      </View>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription}>
                        {product.description}
                      </Text>
                      <Text style={styles.productPrice}>
                        ${product.wholesale_price.toFixed(2)}
                      </Text>
                      <Text style={styles.productIdBadge}>
                        #{product.item_id}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text
                  style={styles.pageNumber}
                  render={({ pageNumber }) => pageNumber}
                  fixed
                />
              </Page>
            ))}
          </React.Fragment>
        );
      })}

      {/* --- BACK COVER --- */}
      <Page size="A4" style={styles.backCover}>
        <View style={styles.backCoverColorBlock}>
          {(info.logoUrl || `${location.origin}${Logo}`) && (
            <Image
              cache={true}
              src={info.logoUrl || `${location.origin}${Logo}`}
              style={styles.backLogo}
            />
          )}
          <Text style={styles.backTagline}>{info.name.toUpperCase()}</Text>
        </View>
        <View style={styles.backCoverWhiteBlock}>
          <View style={styles.backContactGrid}>
            <View style={styles.backContactColumn}>
              <Text style={styles.backContactLabel}>PHONE</Text>
              <Text style={styles.backContactValue}>{info.phone}</Text>
            </View>
            <View style={styles.backContactColumn}>
              <Text style={styles.backContactLabel}>EMAIL</Text>
              <Text style={styles.backContactValue}>{info.email}</Text>
            </View>
          </View>
          <View style={[styles.backContactGrid, { marginTop: 20 }]}>
            <View style={styles.backContactColumn}>
              <Text style={styles.backContactLabel}>WEBSITE</Text>
              <Link href={info.website} style={styles.backContactValue}>
                Vist Our Website
              </Link>
            </View>
            <View style={styles.backContactColumn}>
              <Text style={styles.backContactLabel}>ADDRESS</Text>
              <Text style={styles.backContactValue}>{info.address} </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
