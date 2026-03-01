const dashboardModal = document.getElementById("dashboardModal");
const openDashboardBtn = document.getElementById("openDashboardBtn");
const closeDashboardBtn = document.getElementById("closeDashboardBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const dashboardCapture = document.getElementById("dashboardCapture");

function openDashboard() {
    dashboardModal.classList.add("is-open");
    dashboardModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeDashboard() {
    dashboardModal.classList.remove("is-open");
    dashboardModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

openDashboardBtn.addEventListener("click", openDashboard);
closeDashboardBtn.addEventListener("click", closeDashboard);

dashboardModal.addEventListener("click", function (event) {
    if (event.target === dashboardModal) {
        closeDashboard();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && dashboardModal.classList.contains("is-open")) {
        closeDashboard();
    }
});

downloadPdfBtn.addEventListener("click", async function () {
    if (!window.html2canvas || !window.jspdf) {
        alert("Biblioteca de PDF não carregada.");
        return;
    }

    const previousLabel = downloadPdfBtn.textContent;
    downloadPdfBtn.textContent = "Gerando PDF...";
    downloadPdfBtn.disabled = true;

    try {
        const canvas = await html2canvas(dashboardCapture, {
            scale: 2,
            backgroundColor: "#ffffff"
        });

        const imageData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const imageWidth = pageWidth - margin * 2;
        const imageHeight = (canvas.height * imageWidth) / canvas.width;

        let heightLeft = imageHeight;
        let position = margin;

        pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
        heightLeft -= pageHeight - margin * 2;

        while (heightLeft > 0) {
            pdf.addPage();
            position = margin - (imageHeight - heightLeft);
            pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
            heightLeft -= pageHeight - margin * 2;
        }

        pdf.save("dashboard-netsuite-ficticio.pdf");
    } catch (error) {
        alert("Não foi possível gerar o PDF.");
    } finally {
        downloadPdfBtn.textContent = previousLabel;
        downloadPdfBtn.disabled = false;
    }
});
