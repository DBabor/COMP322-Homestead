document.addEventListener("DOMContentLoaded", () => {
    const cropForm = document.getElementById("cropForm");
    const tableBody = document.querySelector("#cropTable tbody");

    cropForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("cropName").value;
        const time = document.getElementById("growthTime").value;
        const cropyield = document.getElementById("cropYield").value;

        const frostRadio = document.querySelector('input[name="frostSusceptible"]:checked');
        const droughtRadio = document.querySelector('input[name="droughtSusceptible"]:checked');

        const frost = frostRadio ? frostRadio.value : "No";
        const drought = droughtRadio ? droughtRadio.value : "No";

        if (!name || !time || !cropyield) {
            alert("FILL OUT ALL FIELDS");
            return;
        }

        const newRow = document.createElement("tr");

        newRow.innerHTML = `
        <td>${name}</td>
        <td>${time}</td>
        <td>${cropyield}</td>
        <td>${frost}</td>
        <td>${drought}</td>
        <td><button class="delete-btn">Delete</button></td>
        `;

        tableBody.appendChild(newRow);
        cropForm.reset();
    });

    tableBody.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-btn")) {
            event.target.closest("tr").remove();
        }
    });
});