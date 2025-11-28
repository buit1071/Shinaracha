/**
 * PPTX Preprocessor - Prepare photos for Form 8.1 export
 */

import type { Form8_1Data, Form8_1Photos } from "@/components/check-form/forms/form1-8/form8-1/types";

export interface ProcessedPhotos {
  coverPhoto?: string;
  headerPhoto?: string;
  signMainPhoto?: string;
  setAPhotos: string[];
  setBPhotos: string[];
}

/**
 * Preprocess photos for PPTX export
 * Extracts URLs/filenames from various photo formats
 */
export function preprocessForm8_1Photos(photos?: Form8_1Photos): ProcessedPhotos {
  const result: ProcessedPhotos = {
    setAPhotos: [],
    setBPhotos: [],
  };
  
  if (!photos) return result;
  
  // Extract URL from photo item
  const extractUrl = (item: any): string | undefined => {
    if (!item) return undefined;
    if (typeof item === "string") return item;
    return item.url || item.src || item.path || item.filename || item.name;
  };
  
  result.coverPhoto = extractUrl(photos.coverPhoto);
  result.headerPhoto = extractUrl((photos as any).headerImage);
  result.signMainPhoto = extractUrl(photos.signMainPhoto);
  
  // Set A photos
  if (photos.setAPhotos && Array.isArray(photos.setAPhotos)) {
    result.setAPhotos = photos.setAPhotos.map(extractUrl).filter(Boolean) as string[];
  }
  
  // Set B photos
  if (photos.setBPhotos && Array.isArray(photos.setBPhotos)) {
    result.setBPhotos = photos.setBPhotos.map(extractUrl).filter(Boolean) as string[];
  }
  
  return result;
}
