import { mediaApi } from "../services/api";
import type { PendingFile, QRData } from "../types/qr";

export const uploadPendingFile = async (
  pendingFile: PendingFile,
  _fileType: string,
): Promise<{ url: string; publicId: string } | null> => {
  if (!pendingFile.file) return null;

  try {
    const credentials = await mediaApi.getSignature();
    const result = await mediaApi.uploadToCloudinary(
      pendingFile.file,
      credentials,
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.error("Direct upload failed:", err);
    return null;
  }
};

export const uploadAllPendingFiles = async (data: QRData): Promise<QRData> => {
  const updatedData = structuredClone(data);

  if (updatedData.image?.pendingFile) {
    const result = await uploadPendingFile(
      updatedData.image.pendingFile,
      "image",
    );
    if (result) {
      updatedData.image = {
        ...updatedData.image,
        url: result.url,
        publicId: result.publicId,
      };
      delete updatedData.image.pendingFile;
    }
  }

  if (updatedData.images && Array.isArray(updatedData.images)) {
    updatedData.images = await Promise.all(
      updatedData.images.map(async (img: any) => {
        if (img.pendingFile) {
          const result = await uploadPendingFile(img.pendingFile, "image");
          if (result) {
            const { pendingFile: _, ...rest } = img;
            return {
              ...rest,
              url: result.url,
              publicId: result.publicId,
            };
          }
        }
        return img;
      }),
    );
  }

  if (
    updatedData.socials?.images &&
    Array.isArray(updatedData.socials.images)
  ) {
    updatedData.socials.images = await Promise.all(
      updatedData.socials.images.map(async (img: any) => {
        if (img.pendingFile) {
          const result = await uploadPendingFile(img.pendingFile, "image");
          if (result) {
            const { pendingFile: _, ...rest } = img;
            return {
              ...rest,
              url: result.url,
              publicId: result.publicId,
            };
          }
        }
        return img;
      }),
    );
  }

  const fileTypes = ["pdf", "video", "mp3"] as const;
  for (const type of fileTypes) {
    if (updatedData[type]?.pendingFile) {
      const result = await uploadPendingFile(
        updatedData[type].pendingFile,
        type === "mp3" ? "audio" : type,
      );
      if (result) {
        updatedData[type] = {
          ...updatedData[type],
          url: result.url,
          publicId: result.publicId,
        };
        delete updatedData[type].pendingFile;
      }
    }
  }

  if (updatedData.vcard) {
    if (updatedData.vcard.avatarPendingFile) {
      const result = await uploadPendingFile(
        updatedData.vcard.avatarPendingFile,
        "image",
      );
      if (result) {
        updatedData.vcard.avatar = result.url;
        updatedData.vcard.avatarPublicId = result.publicId;
      }
      delete updatedData.vcard.avatarPendingFile;
    }
    if (updatedData.vcard.bannerPendingFile) {
      const result = await uploadPendingFile(
        updatedData.vcard.bannerPendingFile,
        "image",
      );
      if (result) {
        updatedData.vcard.banner = result.url;
        updatedData.vcard.bannerPublicId = result.publicId;
      }
      delete updatedData.vcard.bannerPendingFile;
    }
  }

  if (updatedData.menu) {
    if (updatedData.menu.logoPendingFile) {
      const result = await uploadPendingFile(
        updatedData.menu.logoPendingFile,
        "image",
      );
      if (result) {
        updatedData.menu.logo = result.url;
        updatedData.menu.logoPublicId = result.publicId;
      }
      delete updatedData.menu.logoPendingFile;
    }
    if (updatedData.menu.bannerPendingFile) {
      const result = await uploadPendingFile(
        updatedData.menu.bannerPendingFile,
        "image",
      );
      if (result) {
        updatedData.menu.banner = result.url;
        updatedData.menu.bannerPublicId = result.publicId;
      }
      delete updatedData.menu.bannerPendingFile;
    }
    if (updatedData.menu.categories) {
      for (let cIdx = 0; cIdx < updatedData.menu.categories.length; cIdx++) {
        const category = updatedData.menu.categories[cIdx];
        if (category.items) {
          for (let iIdx = 0; iIdx < category.items.length; iIdx++) {
            const item = category.items[iIdx];
            if (item.imagePendingFile) {
              const result = await uploadPendingFile(
                item.imagePendingFile,
                "image",
              );
              if (result) {
                updatedData.menu.categories[cIdx].items[iIdx].image =
                  result.url;
                updatedData.menu.categories[cIdx].items[iIdx].imagePublicId =
                  result.publicId;
              }
              delete updatedData.menu.categories[cIdx].items[iIdx]
                .imagePendingFile;
            }
          }
        }
      }
    }
  }

  if (updatedData.business) {
    if (updatedData.business.logoPendingFile) {
      const result = await uploadPendingFile(
        updatedData.business.logoPendingFile,
        "image",
      );
      if (result) {
        updatedData.business.logo = result.url;
        updatedData.business.logoPublicId = result.publicId;
      }
      delete updatedData.business.logoPendingFile;
    }
    if (updatedData.business.bannerPendingFile) {
      const result = await uploadPendingFile(
        updatedData.business.bannerPendingFile,
        "image",
      );
      if (result) {
        updatedData.business.banner = result.url;
        updatedData.business.bannerPublicId = result.publicId;
      }
      delete updatedData.business.bannerPendingFile;
    }
  }

  if (updatedData.booking) {
    if (updatedData.booking.profilePendingFile) {
      const result = await uploadPendingFile(
        updatedData.booking.profilePendingFile,
        "image",
      );
      if (result) {
        updatedData.booking.profileImageUrl = result.url;
        updatedData.booking.profilePublicId = result.publicId;
      }
      delete updatedData.booking.profilePendingFile;
    }
    if (updatedData.booking.coverPendingFile) {
      const result = await uploadPendingFile(
        updatedData.booking.coverPendingFile,
        "image",
      );
      if (result) {
        updatedData.booking.imageUrl = result.url;
        updatedData.booking.coverPublicId = result.publicId;
      }
      delete updatedData.booking.coverPendingFile;
    }
  }

  if (updatedData.linksInfo) {
    if (updatedData.linksInfo.avatarPendingFile) {
      const result = await uploadPendingFile(
        updatedData.linksInfo.avatarPendingFile,
        "image",
      );
      if (result) {
        updatedData.linksInfo.avatar = result.url;
        updatedData.linksInfo.avatarPublicId = result.publicId;
      }
      delete updatedData.linksInfo.avatarPendingFile;
    }
    if (updatedData.linksInfo.bannerPendingFile) {
      const result = await uploadPendingFile(
        updatedData.linksInfo.bannerPendingFile,
        "image",
      );
      if (result) {
        updatedData.linksInfo.banner = result.url;
        updatedData.linksInfo.bannerPublicId = result.publicId;
      }
      delete updatedData.linksInfo.bannerPendingFile;
    }
  }

  if (updatedData.app) {
    if (updatedData.app.iconPendingFile) {
      const result = await uploadPendingFile(
        updatedData.app.iconPendingFile,
        "image",
      );
      if (result) {
        updatedData.app.icon = result.url;
        updatedData.app.iconPublicId = result.publicId;
      }
      delete updatedData.app.iconPendingFile;
    }
  }

  if (updatedData.coupon) {
    if (updatedData.coupon.bannerPendingFile) {
      const result = await uploadPendingFile(
        updatedData.coupon.bannerPendingFile,
        "image",
      );
      if (result) {
        updatedData.coupon.banner = result.url;
        updatedData.coupon.bannerPublicId = result.publicId;
      }
      delete updatedData.coupon.bannerPendingFile;
    }
  }

  return updatedData;
};

export const getDownloadUrl = (url: string) => {
  if (!url) return url;
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
};

export const downloadFile = async (url: string, fileName: string) => {
  const downloadUrl = getDownloadUrl(url);

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error("Network response was not ok");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    link.target = "_blank";
    link.click();
  }
};
