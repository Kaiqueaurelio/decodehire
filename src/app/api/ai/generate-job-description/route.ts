import { NextResponse } from "next/server";
export async function POST(request:Request){const body=await request.json();if(!body.cargo)return NextResponse.json({error:"Cargo required"},{status:400});return NextResponse.json({description:`Cargo: ${body.cargo}\n\nResponsabilidades principais, requisitos tecnicos e comportamentais, experiencia desejada e diferenciais para a vaga.`});}
