import pool from "@/lib/db";




export async function GET(){
    try{
        await pool.query("SELECT 1");
        return Response.json({ status: "ok" });

    }catch (error){
        console.error("Database connection error:", error);
        return Response.json({ status: "error" },{ status: 503 });
    }
    
}