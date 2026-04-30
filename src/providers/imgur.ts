export async function uploadToImgur(
  blob: Blob,
  clientId: string
): Promise<string> {
  const form = new FormData();
  form.append("image", blob);

  const res = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: `Client-ID ${clientId}`,
    },
    body: form,
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error("[Purrlet] imgur upload failed");
  }

  return json.data.link;
}