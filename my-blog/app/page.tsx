import Link from 'next/link';
import OrbitCircle from "./components/OrbitCircle";

export default function Home() {
  return (
   <>
    <div className="max-w-4xl mx-auto px-8 py-20">
      <h1 className="text-5xl font-bold mb-6">
        Hello there, I'm Nanxncndnx
      </h1>
      
      <p className="text-xl text-gray-700 mb-12 leading-relaxed">
        Welcome to my personal website. Here I share my thoughts through blog posts, 
        book reviews, and in-depth documentation on topics I'm passionate about.
      </p>

    </div>
        <div style={{ 
          display: "flex", justifyContent: "center",
          alignItems: "center", minHeight: "40vh", marginTop: "-6rem",
        }}>
      <OrbitCircle />
    </div>
   </>
  );
}
