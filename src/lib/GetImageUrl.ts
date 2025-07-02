import { supabase } from "@/supabase";

export const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  const { data } = supabase.storage.from("images").getPublicUrl(imagePath);
  console.log(data.publicUrl);

  return data.publicUrl;
};
