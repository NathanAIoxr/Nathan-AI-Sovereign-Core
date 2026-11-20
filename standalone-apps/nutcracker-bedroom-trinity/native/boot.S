.code16
.global _start
.section .text
_start:
  ljmp $0, $initialize
initialize:
  cli
  xorw %ax, %ax
  movw %ax, %ds
  movw %ax, %es
  movw %ax, %ss
  movw $0x7b00, %sp
  cld
  sti
  movb %dl, drive
  movw $0x8000, %bx
  movw $0x0204, %ax
  movw $0x0002, %cx
  xorw %dx, %dx
  movb drive, %dl
  int $0x13
  jc error
  ljmp $0, $0x8000
error:
  movw $failure, %si
print_error:
  lodsb
  testb %al, %al
  jz stop
  movw $0x0007, %bx
  movb $0x0e, %ah
  int $0x10
  jmp print_error
stop:
  cli
  hlt
  jmp stop
drive: .byte 0
failure: .asciz "LLMAGI boot: disk read failed.\r\n"
.org 510
.word 0xaa55
