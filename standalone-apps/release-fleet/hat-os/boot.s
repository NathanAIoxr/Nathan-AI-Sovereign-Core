/* HAT OS boot diagnostic. VGA and COM1 output, BIOS keyboard input. */
.code16
.global _start
.text
_start:
    cli
    xorw %ax, %ax
    movw %ax, %ds
    movw %ax, %es
    movw %ax, %ss
    movw $0x7c00, %sp
    sti
    cld

    movw $0x3f9, %dx
    outb %al, %dx
    movw $0x3fb, %dx
    movb $0x80, %al
    outb %al, %dx
    movw $0x3f8, %dx
    movb $1, %al
    outb %al, %dx
    movw $0x3f9, %dx
    xorb %al, %al
    outb %al, %dx
    movw $0x3fb, %dx
    movb $3, %al
    outb %al, %dx

    movw $banner, %si
    call print_text
choose:
    xorb %ah, %ah
    int $0x16
    cmpb $'1', %al
    je work
    cmpb $'2', %al
    je creator
    cmpb $'3', %al
    je gaming
    cmpb $'4', %al
    jne choose
    movw $ghost_text, %si
    jmp show
work:
    movw $work_text, %si
    jmp show
creator:
    movw $creator_text, %si
    jmp show
gaming:
    movw $gaming_text, %si
show:
    call print_text
    jmp choose

print_text:
    lodsb
    testb %al, %al
    jz done
    pushw %ax
    movw $0x3fd, %dx
ready:
    inb %dx, %al
    testb $0x20, %al
    jz ready
    popw %ax
    movw $0x3f8, %dx
    outb %al, %dx
    movb $0x0e, %ah
    movw $7, %bx
    pushw %si
    int $0x10
    popw %si
    jmp print_text
done:
    ret

banner: .asciz "HAT OS boot diagnostic\r\n1 Work  2 Creator  3 Gaming  4 Ghost\r\nHATOS:BOOT_READY\r\n"
work_text: .asciz "HATOS:WORK\r\n"
creator_text: .asciz "HATOS:CREATOR\r\n"
gaming_text: .asciz "HATOS:GAMING\r\n"
ghost_text: .asciz "HATOS:GHOST\r\n"
.org 510
.word 0xaa55
