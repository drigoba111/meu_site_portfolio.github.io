$(function () {
    const $downloadPdfBtn = $("#downloadPdfBtn");
    const $dashboardCapture = $("#dashboardCapture");

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
