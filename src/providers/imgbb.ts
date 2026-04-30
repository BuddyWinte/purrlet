export async function uploadToImgbb(
  blob: Blob,
  apiKey: string
): Promise<string> {
  const form = new FormData();
  form.append("image", blob);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    {
      method: "POST",
      body: form,
    }
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error("[Purrlet] imgbb upload failed");
  }

  return json.data.url;
}