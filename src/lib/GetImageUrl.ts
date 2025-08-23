import { supabase } from "@/supabase";

export const getImageUrl = (imagePath: string | null, renderInDev = true) => {
  if (!imagePath) return null;
  if (!renderInDev) return "https://placehold.co/500/png?text=Image";
  const { data } = supabase.storage.from("images").getPublicUrl(imagePath);
  console.log(data.publicUrl);

  return data.publicUrl;
};
