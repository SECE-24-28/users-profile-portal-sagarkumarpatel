import type { Metadata } from "next";
import "./globals.css"; // Ensure standard Tailwind or Next styles are active

export const metadata: Metadata = {
  title: "Student Profiles Management",
  description: "Next.js GraphQL Practice Task",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased p-8">{children}</body>
    </html>
  );
}