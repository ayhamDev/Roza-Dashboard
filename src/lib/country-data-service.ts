//@ts-ignore
import countryRegionData from "country-region-data/dist/data-umd";
import { filterCountries } from "@/lib/helpers";

export interface Region {
  name: string;
  shortCode: string;
}

export interface CountryRegion {
  countryName: string;
  countryShortCode: string;
  regions: Region[];
}

export interface FilterOptions {
  priorityOptions?: string[];
  whitelist?: string[];
  blacklist?: string[];
}

class CountryDataService {
  private cache = new Map<string, CountryRegion[]>();
  private allCountries: CountryRegion[] = [];
  private isInitialized = false;

  constructor() {
    // Preload all countries immediately when service is created
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    try {
      // Process all countries once at startup
      this.allCountries = countryRegionData as CountryRegion[];
      this.isInitialized = true;

      // Preload common configurations
      this.preloadCommonConfigurations();
    } catch (error) {
      console.error("Failed to initialize country data:", error);
    }
  }

  private preloadCommonConfigurations() {
    // Preload some common filter combinations
    const commonConfigs = [
      { priorityOptions: [], whitelist: [], blacklist: [] }, // All countries
      { priorityOptions: ["US", "CA", "GB"], whitelist: [], blacklist: [] }, // With priorities
      {
        priorityOptions: [],
        whitelist: ["US", "CA", "GB", "AU", "DE", "FR"],
        blacklist: [],
      }, // Common whitelist
    ];

    commonConfigs.forEach((config) => {
      this.getFilteredCountries(
        config.priorityOptions,
        config.whitelist,
        config.blacklist
      );
    });
  }

  private getCacheKey(
    priorityOptions: string[],
    whitelist: string[],
    blacklist: string[]
  ): string {
    return JSON.stringify({
      p: priorityOptions.sort(),
      w: whitelist.sort(),
      b: blacklist.sort(),
    });
  }

  public getFilteredCountries(
    priorityOptions: string[] = [],
    whitelist: string[] = [],
    blacklist: string[] = []
  ): CountryRegion[] {
    const cacheKey = this.getCacheKey(priorityOptions, whitelist, blacklist);

    if (!this.cache.has(cacheKey)) {
      const filtered = filterCountries(
        this.allCountries,
        priorityOptions,
        whitelist,
        blacklist
      );
      this.cache.set(cacheKey, filtered);
    }

    return this.cache.get(cacheKey)!;
  }

  public getAllCountries(): CountryRegion[] {
    return this.allCountries;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

// Create singleton instance - this runs immediately when module is imported
export const countryDataService = new CountryDataService();
