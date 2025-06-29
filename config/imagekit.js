import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey:
    process.env.IMAGEKIT_PUBLIC_KEY || "public_mC6VFn60l6J3VOHbpwMhq+hzYpE=",
  privateKey:
    process.env.IMAGEKIT_PRIVATE_KEY || "private_/uL7GO1+IiVRHMRINCSvtnfpGr0=",
  urlEndpoint:
    process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/bhupeshb7",
});

export default imagekit;
