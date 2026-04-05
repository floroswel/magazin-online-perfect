import Layout from "@/components/layout/Layout";
import HeroSlider from "@/components/home/HeroSlider";
import FlashDealsBar from "@/components/home/FlashDealsBar";
import CategoryGrid from "@/components/home/CategoryGrid";
import PromoBanners from "@/components/home/PromoBanners";
import BestSellers from "@/components/home/BestSellers";
import TrustStrip from "@/components/home/TrustStrip";
import NewArrivals from "@/components/home/NewArrivals";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import Newsletter from "@/components/home/Newsletter";
import { useSettings } from "@/hooks/useSettings";

export default function Index() {
  const settings = useSettings();

  return (
    <Layout>
      {settings.show_hero !== "false" && <HeroSlider />}
      {settings.show_flash_deals !== "false" && <FlashDealsBar />}
      {settings.show_categories !== "false" && <CategoryGrid />}
      {settings.show_promo_banners !== "false" && <PromoBanners />}
      {settings.show_featured !== "false" && <BestSellers />}
      {settings.show_trust !== "false" && <TrustStrip />}
      {settings.show_new_arrivals !== "false" && <NewArrivals />}
      {settings.show_recently_viewed !== "false" && <RecentlyViewed />}
      {settings.show_newsletter !== "false" && <Newsletter />}
    </Layout>
  );
}
