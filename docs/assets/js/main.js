$(function () {
    const $dashboardModal = $("#dashboardModal");
    const $openDashboardBtn = $("#openDashboardBtn");
    const $closeDashboardBtn = $("#closeDashboardBtn");
    const $downloadPdfBtn = $("#downloadPdfBtn");
    const $dashboardCapture = $("#dashboardCapture");

    function openDashboard() {
        $dashboardModal.addClass("is-open").attr("aria-hidden", "false");
        $("body").addClass("modal-open");
    }

    function closeDashboard() {
        $dashboardModal.removeClass("is-open").attr("aria-hidden", "true");
        $("body").removeClass("modal-open");
    }

    $openDashboardBtn.on("click", openDashboard);
    $closeDashboardBtn.on("click", closeDashboard);

    $dashboardModal.on("click", function (event) {
        if (event.target === $dashboardModal.get(0)) {
            closeDashboard();
        }
    });

    $(document).on("keydown", function (event) {
        if (event.key === "Escape" && $dashboardModal.hasClass("is-open")) {
            closeDashboard();
        }
    });

    $downloadPdfBtn.on("click", async function () {
        if (!window.html2canvas || !window.jspdf) {
            alert("Biblioteca de PDF não carregada.");
            return;
        }

        const previousLabel = $downloadPdfBtn.text();
        $downloadPdfBtn.text("Gerando PDF...").prop("disabled", true);

        try {
            const canvas = await html2canvas($dashboardCapture.get(0), {
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
            $downloadPdfBtn.text(previousLabel).prop("disabled", false);
        }
    });
});
