export default function SectionHeading({ 
  title, 
  subtitle, 
  alignment = "left",
  light = false
}: { 
  title: string; 
  subtitle?: string; 
  alignment?: "left" | "center";
  light?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 ${alignment === "center" ? "items-center text-center" : "items-start text-left"}`}>
      {subtitle && (
        <span className={`text-sm font-bold tracking-wider uppercase ${light ? "text-white/80" : "text-secondary"}`}>
          {subtitle}
        </span>
      )}
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-serif font-bold ${light ? "text-white" : "text-foreground"}`}>
        {title}
      </h2>
      <div className={`w-20 h-1.5 mt-2 rounded-full ${light ? "bg-white/30" : "bg-primary"}`} />
    </div>
  );
}
