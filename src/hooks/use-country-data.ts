"use client";

import { useEffect, useState } from "react";
import {
  countryDataService,
  type CountryRegion,
} from "@/lib/country-data-service";

interface UseCountryDataOptions {
  priorityOptions?: string[];
  whitelist?: string[];
  blacklist?: string[];
}

export function useCountryData({
  priorityOptions = [],
  whitelist = [],
  blacklist = [],
}: UseCountryDataOptions = {}) {
  const [countries, setCountries] = useState<CountryRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Since data is preloaded, this should be instant
    const filtered = countryDataService.getFilteredCountries(
      priorityOptions,
      whitelist,
      blacklist
    );
    setCountries(filtered);
    setIsLoading(false);
  }, [priorityOptions, whitelist, blacklist]);

  return {
    countries,
    isLoading,
    allCountries: countryDataService.getAllCountries(),
  };
}
