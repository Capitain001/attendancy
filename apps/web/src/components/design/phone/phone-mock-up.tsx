import {
  PhoneCarousel,
  type ImageItem,
} from "@/components/design/phone/phone-carousel";

const exampleImages: ImageItem[] = [
  {
    src: "https://res.cloudinary.com/harshitproject/image/upload/v1746774805/Behance-screen.png",
    alt: "Sankalp app screen 1",
  },
  {
    src: "https://res.cloudinary.com/harshitproject/image/upload/v1746774805/Notion-screen.png",
    alt: "Sankalp app screen 2",
  },
  {
    src: "https://res.cloudinary.com/harshitproject/image/upload/v1746774806/One-screen.png",
    alt: "Sankalp app screen 3",
  },
  {
    src: "https://res.cloudinary.com/harshitproject/image/upload/v1746774807/Reddit-nj7hwh.png",
    alt: "Sankalp app screen 4",
  },
];

export default function PhoneMockupBasic() {
  return <PhoneCarousel images={exampleImages} />;
}

export { exampleImages, type ImageItem };