const width = 1000;
const height = 1000;

function convert(x, y) {
    const s_hsv = x / width;
    const v_hsv = 1 - (y / height);

    let l = v_hsv * (1 - s_hsv / 2);
    let s_hsl = 0;
    if (l > 0 && l < 1) {
        s_hsl = (v_hsv - l) / Math.min(l, 1 - l);
    }

    const s_out = Math.round(s_hsl * 100);
    const l_out = Math.round(l * 100);

    // Reverse
    const s_hsl_rev = s_out / 100;
    const l_val_rev = l_out / 100;

    const v_hsv_rev = l_val_rev + s_hsl_rev * Math.min(l_val_rev, 1 - l_val_rev);
    const s_hsv_rev = v_hsv_rev === 0 ? 0 : 2 * (1 - l_val_rev / v_hsv_rev);

    const lastX = s_hsv_rev * width;
    const lastY = (1 - v_hsv_rev) * height;

    console.log(`IN: (${x}, ${y}) -> S: ${s_out} L: ${l_out} -> OUT: (${lastX.toFixed(2)}, ${lastY.toFixed(2)}) DIFF: (${Math.abs(x - lastX).toFixed(2)}, ${Math.abs(y - lastY).toFixed(2)})`);
}

convert(500, 500);
convert(100, 100);
convert(900, 100);
convert(900, 900);
convert(10, 990);
convert(990, 10);
