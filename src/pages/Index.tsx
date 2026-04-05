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

export default function Index() {
  return (
    <Layout>
      <HeroSlider />
      <FlashDealsBar />
      <CategoryGrid />
      <PromoBanners />
      <BestSellers />
      <TrustStrip />
      <NewArrivals />
      <RecentlyViewed />
      <Newsletter />
    </Layout>
  );
}
