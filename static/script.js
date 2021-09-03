const $ = (tag, all) => all ? document.querySelectorAll(tag) : document.querySelector(tag);
function toggleNav(){
  $("#navbar").classList.toggle("nav-show");
  $("#navbar").classList.toggle("nav-hide");
  $("#nav-btn").classList.toggle("btn-in");
  $("#nav-btn").classList.toggle("btn-out");
}
feather.replace();

let paragraphs = $("p", true);
paragraphs.forEach(par => {
  let cont = par.innerHTML.split(' ');
  let res = [];
  for (var i in cont) {
    if (cont[i].length >= 8 && (!cont[i].includes("<") && !cont[i].includes(">"))) {
      let t = cont[i];
      res.push(t.slice(0, Math.round(t.length / 2)) + "&shy;" + t.slice(Math.round(t.length / 2), t.length))
    } else {
      res.push(cont[i]);
    }
  }
  par.innerHTML = res.join` `;
})

$("input", true).forEach(x => x.autocomplete = "off")

async function getJSON(route) {
  const res = await fetch(route, { headers: {}, method: "GET", mode: "cors" });
  return await res.json()
}