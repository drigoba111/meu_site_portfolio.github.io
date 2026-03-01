$(function () {
    const $barFills = $("#dashboardCapture .bar-fill");
    const $donut = $("#dashboardCapture .donut");

    $barFills.each(function () {
        const $bar = $(this);
        const value = Number($bar.data("value")) || 0;
        const normalized = Math.min(Math.max(value, 0), 100);
        $bar.css("width", normalized + "%");
    });

    if ($donut.length) {
        const value = Number($donut.data("value")) || 0;
        const normalized = Math.min(Math.max(value, 0), 100);
        $donut.css("background", "conic-gradient(#3f7cff 0 " + normalized + "%, #cfe0ff " + normalized + "% 100%)");
        $donut.attr("data-label", normalized + "%");
        $donut.attr("aria-label", normalized + " por cento no prazo");
    }
});
