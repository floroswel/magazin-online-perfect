import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function BlogPreview() {
  const [posts, setPosts] = useState<Tables<"blog_posts">[]>([]);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setPosts(data || []));
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Din blogul nostru</h2>
        <Link to="/catalog" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
          Vezi toate <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map(post => (
          <article key={post.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
            {post.featured_image && (
              <div className="aspect-video overflow-hidden">
                <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{post.title}</h3>
              {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
              <span className="text-xs text-muted-foreground mt-2 block">
                {post.published_at && new Date(post.published_at).toLocaleDateString("ro-RO")}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
