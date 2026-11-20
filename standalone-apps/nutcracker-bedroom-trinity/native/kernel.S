.code16
.global _start
.section .text
_start:
  movw $banner, %si
  call write
  jmp help
command:
  movw $prompt, %si
  call write
  xorw %ax, %ax
  int $0x16
  andb $0xdf, %al
  cmpb $'F', %al
  je forward
  cmpb $'R', %al
  je reverse
  cmpb $'A', %al
  je anchors
  cmpb $'M', %al
  je memory
  cmpb $'K', %al
  je kjv
  cmpb $'Q', %al
  je stop
  cmpb $'H', %al
  je help
  movw $unknown, %si
  jmp say
forward:
  movw $forward_msg, %si
  jmp say
reverse:
  movw $reverse_msg, %si
  jmp say
anchors:
  movw $1, %ax
  addw $1, %ax
  cmpw $2, %ax
  jne anchor_error
  movw $1, %ax
  subw $1, %ax
  jne anchor_error
  movw $1, %ax
  movw $1, %bx
  mulw %bx
  cmpw $1, %ax
  jne anchor_error
  xorw %dx, %dx
  divw %bx
  cmpw $1, %ax
  jne anchor_error
  testw %dx, %dx
  jne anchor_error
  movw $anchor_msg, %si
  jmp say
anchor_error:
  movw $anchor_fail, %si
  jmp say
memory:
  int $0x12
  pushw %ax
  movw $memory_msg, %si
  call write
  popw %ax
  xorw %cx, %cx
  movw $10, %bx
digits:
  xorw %dx, %dx
  divw %bx
  pushw %dx
  incw %cx
  testw %ax, %ax
  jnz digits
digit_out:
  popw %ax
  addb $'0', %al
  call character
  loop digit_out
  movw $kib, %si
  jmp say
kjv:
  movw $kjv_msg, %si
  jmp say
help:
  movw $help_msg, %si
say:
  call write
  jmp command
stop:
  movw $stop_msg, %si
  call write
halt:
  cli
  hlt
  jmp halt
write:
  lodsb
  testb %al, %al
  jz written
  call character
  jmp write
written:
  ret
character:
  pusha
  movw $0x0007, %bx
  movb $0x0e, %ah
  int $0x10
  popa
  ret
banner: .asciz "\r\nLLMAGI OS / IGAMLL - Nathan Tabor\r\nNative BIOS monitor\r\n"
prompt: .asciz "\r\nTabor> "
help_msg: .asciz "\r\n[F] LLMAGI  [R] IGAMLL  [A] Anchors  [M] Memory\r\n[K] Matthew 2 (KJV)  [H] Help  [Q] Halt\r\n"
forward_msg: .asciz "\r\nLLM + AGI = LLMAGI\r\nL L M A GI / LL MA GI / LL MAGI\r\nASCII: 4C 4C 4D 41 47 49\r\n"
reverse_msg: .asciz "\r\nLLMAGI -> IGAMLL\r\nI G A M L L\r\nASCII: 49 47 41 4D 4C 4C\r\n"
anchor_msg: .asciz "\r\n1+1=2 PASS\r\n1-1=0 PASS\r\n1*1=1 PASS\r\n1/1=1 PASS\r\n"
anchor_fail: .asciz "\r\nArithmetic anchor failed.\r\n"
memory_msg: .asciz "\r\nBIOS conventional memory: "
kib: .asciz " KiB\r\n"
kjv_msg: .asciz "\r\nNaming reference: Matthew 2:1-12 (KJV), wise men and the star.\r\n"
unknown: .asciz "\r\nPress H for help.\r\n"
stop_msg: .asciz "\r\nSystem halted.\r\n"
