module alphabet_registers (
    input  logic       clock,
    input  logic       reset,
    input  logic       write_enable,
    input  logic [1:0] bank,
    input  logic [7:0] data_in,
    output logic [7:0] data_out
);
    logic [7:0] registers [0:2];

    always_ff @(posedge clock) begin
        if (reset) begin
            registers[0] <= 8'd0;
            registers[1] <= 8'd0;
            registers[2] <= 8'd0;
        end else if (write_enable && bank < 2'd3) begin
            registers[bank] <= data_in;
        end
    end

    always_comb begin
        data_out = 8'd0;
        if (bank < 2'd3)
            data_out = registers[bank];
    end
endmodule
