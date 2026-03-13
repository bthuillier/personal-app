import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/api/client";

export function HomePage() {
  const { data: guitars = [] } = useQuery({
    queryKey: ["guitars"],
    queryFn: async () => {
      const { data } = await api.GET("/guitars");
      return data!;
    },
  });

  const { data: amplifiers = [] } = useQuery({
    queryKey: ["amplifiers"],
    queryFn: async () => {
      const { data } = await api.GET("/amplifiers");
      return data!;
    },
  });

  const { data: pedals = [] } = useQuery({
    queryKey: ["guitar-pedals"],
    queryFn: async () => {
      const { data } = await api.GET("/guitar-pedals");
      return data!;
    },
  });

  const { data: albums = [] } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data } = await api.GET("/albums");
      return data!;
    },
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist-albums"],
    queryFn: async () => {
      const { data } = await api.GET("/wishlist/albums");
      return data!;
    },
  });

  const totalGear = guitars.length + amplifiers.length + pedals.length;
  const totalMusic = albums.length + wishlist.length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-muted-foreground">Overview of your collection</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Link
          to="/gear"
          className="rounded-lg border border-border p-6 transition-colors hover:bg-muted/50"
        >
          <h2 className="text-lg font-semibold">Gear</h2>
          <p className="mt-1 text-3xl font-bold">{totalGear}</p>
          <p className="text-sm text-muted-foreground">
            {guitars.length} guitars · {amplifiers.length} amps ·{" "}
            {pedals.length} pedals
          </p>
        </Link>

        <Link
          to="/music"
          className="rounded-lg border border-border p-6 transition-colors hover:bg-muted/50"
        >
          <h2 className="text-lg font-semibold">Music</h2>
          <p className="mt-1 text-3xl font-bold">{totalMusic}</p>
          <p className="text-sm text-muted-foreground">
            {albums.length} albums · {wishlist.length} wishlist items
          </p>
        </Link>
      </div>
    </div>
  );
}
