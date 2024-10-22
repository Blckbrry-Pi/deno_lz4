#![no_main]
#![feature(alloc_error_handler, const_mut_refs, allocator_api)]


use lz4_compression::prelude::compress as lz4_compress;
use lz4_compression::prelude::decompress as lz4_decompress;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[no_mangle]
pub unsafe fn alloc(size: usize) -> *mut u8 {
    let align = core::mem::align_of::<usize>();
    let layout = core::alloc::Layout::from_size_align_unchecked(size, align);
    std::alloc::alloc(layout)
}

#[no_mangle]
pub unsafe fn dealloc(ptr: *mut u8, size: usize) {
    let align = core::mem::align_of::<usize>();
    let layout = core::alloc::Layout::from_size_align_unchecked(size, align);
    std::alloc::dealloc(ptr, layout);
}

#[no_mangle]
pub unsafe fn compress(
    data_ptr: *const u8,
    data_len: u32,
    
    output_data_ptr: *mut *mut u8,
    output_length_ptr: *mut u32,
    output_capacity_ptr: *mut u32,
) {
    let data = core::slice::from_raw_parts(data_ptr, data_len as usize);
    let mut vec = std::mem::ManuallyDrop::new(lz4_compress(data));

    *output_data_ptr = vec.as_mut_ptr();
    *output_length_ptr = vec.len() as u32;
    *output_capacity_ptr = vec.capacity() as u32;
}

#[no_mangle]
pub unsafe fn decompress(
    data_ptr: *const u8,
    data_len: u32,
    
    output_data_ptr: *mut *mut u8,
    output_length_ptr: *mut u32,
    output_capacity_ptr: *mut u32,
) {
    let data = core::slice::from_raw_parts(data_ptr, data_len as usize);
    let mut vec = std::mem::ManuallyDrop::new(lz4_decompress(data).unwrap());

    *output_data_ptr = vec.as_mut_ptr();
    *output_length_ptr = vec.len() as u32;
    *output_capacity_ptr = vec.capacity() as u32;
}

#[no_mangle]
pub unsafe fn dealloc_vec(
    data_ptr: *mut u8,
    length: u32,
    capacity: u32,
) {
    drop(Vec::from_raw_parts(data_ptr, length as usize, capacity as usize));
}
