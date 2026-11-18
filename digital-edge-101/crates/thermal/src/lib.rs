#![no_std]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

#[no_mangle]
pub extern "C" fn heat_cell(center: f64, left: f64, right: f64, ratio: f64) -> f64 {
    center + ratio * (left - 2.0 * center + right)
}
