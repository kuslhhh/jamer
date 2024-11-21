import { searchSongResult } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  params: { params: { name: string } }
) {
  const page = req.nextUrl.searchParams.get("page");

  const data = await fetch(
    `${process.env.BACKEND_URI}/api/search/songs?query=${
      params.params.name
    }&page=${page || 0}`
  );

  if (data.ok) {
    const result = (await data.json()) as searchSongResult;
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json({ message: "Failed to fetch" }, { status: 500 });
  }
}
