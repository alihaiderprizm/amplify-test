import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "testStorageNextGen2Bucket",
  access: (allow) => ({
    "product-images/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read"]),
      allow.groups(["Admin"]).to(["read", "write", "delete"]),
    ],
  }),
});
