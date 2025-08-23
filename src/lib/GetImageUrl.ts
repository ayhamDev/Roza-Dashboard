import { supabase } from "@/supabase";

export const getImageUrl = (imagePath: string | null, renderInDev = true) => {
  if (!imagePath) return null;
  if (!renderInDev) return "https://placehold.co/300/png?text=Image";
  const { data } = supabase.storage.from("images").getPublicUrl(imagePath);

  return data.publicUrl;
};
