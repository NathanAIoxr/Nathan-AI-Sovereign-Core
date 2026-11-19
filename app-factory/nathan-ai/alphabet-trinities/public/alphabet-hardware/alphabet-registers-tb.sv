module alphabet_registers_tb;
    logic clock = 0;
    logic reset = 0;
    logic write_enable = 0;
    logic [1:0] bank = 0;
    logic [7:0] data_in = 0;
    wire [7:0] data_out;

    alphabet_registers dut (.*);

    task automatic tick;
        #5 clock = 1;
        #5 clock = 0;
    endtask

    task automatic check(input logic [1:0] selected, input logic [7:0] expected);
        bank = selected;
        #1;
        if (data_out !== expected)
            $fatal(1, "Bank %d: expected %d, got %d", selected, expected, data_out);
    endtask

    initial begin
        reset = 1;
        tick();
        reset = 0;
        check(0, 0);
        check(1, 0);
        check(2, 0);
        write_enable = 1;
        for (integer idx = 0; idx < 3; idx = idx + 1) begin
            bank = idx[1:0];
            data_in = 8'd40 + idx[7:0];
            tick();
        end
        bank = 3;
        data_in = 255;
        tick();
        check(3, 0);
        write_enable = 0;
        bank = 1;
        tick();
        check(0, 40);
        check(1, 41);
        check(2, 42);
        reset = 1;
        write_enable = 1;
        tick();
        check(0, 0);
        check(1, 0);
        check(2, 0);
        $display("Alphabet registers passed");
        $finish;
    end
endmodule
