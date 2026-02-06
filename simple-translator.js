function translateNumberToCode(num) {
  switch(num) {
    case 1: 
      return `alert("تم تنفيذ رقم 1!");`;
    case 2: 
      return `
        const img = document.createElement("img");
        img.src = "https://via.placeholder.com/200x100.png?text=Hello+Server";
        img.style.display = "block";
        img.style.margin = "10px auto";
        document.body.appendChild(img);
      `;
    case 3: 
      return `document.body.style.background = "pink";`;
    default: 
      return `console.log("رقم غير معروف:", ${num});`;
  }
}
