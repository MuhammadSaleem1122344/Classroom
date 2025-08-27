// excel.js
import supabase from "./script.js";


async function exportExcel() {
  try {
    const { data: classes } = await supabase.from("classes").select("*");
    const { data: assignments } = await supabase.from("assignments").select("*");
    const { data: posts } = await supabase.from("posts").select("*");
    const  {data:people} = await supabase.from("people").select("*");
    const {data:class_people} = await supabase.from("class_people").select("*")


    const wb = XLSX.utils.book_new();

    if (classes?.length) {
      const ws1 = XLSX.utils.json_to_sheet(classes);
      XLSX.utils.book_append_sheet(wb, ws1, "Classes");
    }

    if (assignments?.length) {
      const ws2 = XLSX.utils.json_to_sheet(assignments);
      XLSX.utils.book_append_sheet(wb, ws2, "Assignments");
    }

    if (posts?.length) {
      const ws3 = XLSX.utils.json_to_sheet(posts);
      XLSX.utils.book_append_sheet(wb, ws3, "Posts");
    }
   
     if ( class_people?.length) {
  const ws4 = XLSX.utils.json_to_sheet(class_people);
  XLSX.utils.book_append_sheet(wb, ws4, "class_people");
}
if ( people?.length) {
  const ws4 = XLSX.utils.json_to_sheet(people);
  XLSX.utils.book_append_sheet(wb, ws4, "people");
}

    XLSX.writeFile(wb, "classroom_export.xlsx");
  } catch (err) {
    console.error("Excel export error:", err);
    alert("Failed to export Excel.");
  }
}

document.getElementById("exportBtn")?.addEventListener("click", exportExcel);
