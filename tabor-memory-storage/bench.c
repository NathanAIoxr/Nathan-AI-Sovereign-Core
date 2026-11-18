#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

#define MIB (1024UL * 1024)
#define ALIGNMENT 4096UL

static uint64_t tick(void) {
    struct timespec now;
    if (clock_gettime(CLOCK_MONOTONIC, &now)) {
        perror("clock_gettime");
        exit(EXIT_FAILURE);
    }
    return (uint64_t)now.tv_sec * 1000000000 + (uint64_t)now.tv_nsec;
}

static void fail(const char *operation) {
    perror(operation);
    exit(EXIT_FAILURE);
}

static int compare_ticks(const void *left, const void *right) {
    uint64_t a = *(const uint64_t *)left, b = *(const uint64_t *)right;
    return (a > b) - (a < b);
}

static void *allocate(size_t bytes, size_t alignment) {
    void *buffer = NULL;
    int error = posix_memalign(&buffer, alignment, bytes);
    if (error) {
        errno = error;
        fail("posix_memalign");
    }
    return buffer;
}

static void benchmark_ram(size_t bytes) {
    unsigned char *source = allocate(bytes, ALIGNMENT);
    unsigned char *destination = allocate(bytes, ALIGNMENT);
    memset(source, 0x51, bytes);
    memset(destination, 0, bytes);
    uint64_t start = tick();
    for (unsigned round = 0; round < 8; ++round) {
        source[0] = (unsigned char)round;
        memcpy(destination, source, bytes);
        __asm__ volatile("" : : "r"(destination) : "memory");
    }
    uint64_t elapsed = tick() - start;
    if (memcmp(source, destination, bytes)) {
        fputs("RAM verification failed\n", stderr);
        exit(EXIT_FAILURE);
    }
    printf("{\"mode\":\"ram-copy\",\"copies\":8,\"bytes_per_copy\":%zu,"
           "\"elapsed_ns\":%" PRIu64 ",\"verified\":true}\n", bytes, elapsed);
    free(destination);
    free(source);
}

static int temporary_file(const char *directory) {
    char *name = NULL;
    if (asprintf(&name, "%s/.tabor-storage-XXXXXX", directory) < 0) fail("temporary path");
    int fd = mkostemp(name, O_CLOEXEC);
    if (fd < 0) fail("create unique benchmark file");
    if (unlink(name)) fail("unlink unique benchmark file");
    free(name);
    return fd;
}

static size_t configure_direct(int fd) {
    size_t alignment = ALIGNMENT;
#ifdef STATX_DIOALIGN
    struct statx details;
    if (statx(fd, "", AT_EMPTY_PATH, STATX_DIOALIGN, &details) == 0 &&
        (details.stx_mask & STATX_DIOALIGN)) {
        if (!details.stx_dio_mem_align || !details.stx_dio_offset_align) {
            errno = EOPNOTSUPP;
            fail("filesystem direct I/O alignment");
        }
        if (alignment < details.stx_dio_mem_align) alignment = details.stx_dio_mem_align;
        if (MIB % details.stx_dio_offset_align != 0) {
            errno = EINVAL;
            fail("filesystem direct I/O offset alignment");
        }
    }
#endif
    int flags = fcntl(fd, F_GETFL);
    if (flags < 0 || fcntl(fd, F_SETFL, flags | O_DIRECT) < 0) fail("enable direct I/O");
    return alignment;
}

static uint64_t block_io(int fd, void *buffer, off_t offset, int writing) {
    uint64_t start = tick();
    ssize_t count;
    do {
        count = writing ? pwrite(fd, buffer, MIB, offset) : pread(fd, buffer, MIB, offset);
    } while (count < 0 && errno == EINTR);
    if (count != (ssize_t)MIB) {
        if (count >= 0) errno = EIO;
        fail(writing ? "write benchmark block" : "read benchmark block");
    }
    return tick() - start;
}

static uint64_t p99(uint64_t *values, size_t count) {
    qsort(values, count, sizeof(*values), compare_ticks);
    return values[(99 * count + 99) / 100 - 1];
}

static void benchmark_storage(const char *directory, size_t blocks, int direct) {
    int fd = temporary_file(directory);
    size_t alignment = direct ? configure_direct(fd) : ALIGNMENT;
    unsigned char *expected = allocate(MIB, alignment), *observed = allocate(MIB, alignment);
    uint64_t writes[1024], reads[1024], write_ns = 0, read_ns = 0;
    uint64_t pattern = UINT64_C(0x7f2604b9a83e591d);
    for (size_t offset = 0; offset < MIB; ++offset) {
        pattern ^= pattern << 13;
        pattern ^= pattern >> 7;
        pattern ^= pattern << 17;
        expected[offset] = (unsigned char)pattern;
    }
    for (size_t block = 0; block < blocks; ++block) {
        memcpy(expected, &block, sizeof(block));
        writes[block] = block_io(fd, expected, (off_t)(block * MIB), 1);
        write_ns += writes[block];
    }
    uint64_t sync_start = tick();
    if (fdatasync(fd)) fail("fdatasync benchmark file");
    uint64_t sync_ns = tick() - sync_start;
    for (size_t block = 0; block < blocks; ++block) {
        reads[block] = block_io(fd, observed, (off_t)(block * MIB), 0);
        read_ns += reads[block];
        memcpy(expected, &block, sizeof(block));
        if (memcmp(observed, expected, MIB)) {
            fprintf(stderr, "Readback mismatch at block %zu\n", block);
            exit(EXIT_FAILURE);
        }
    }
    if (close(fd)) fail("close benchmark file");
    printf("{\"mode\":\"%s\",\"io_pattern\":\"sequential-1MiB-queue-depth-1\","
           "\"bytes\":%zu,\"write_ns\":%" PRIu64 ",\"sync_ns\":%" PRIu64
           ",\"read_ns\":%" PRIu64 ",\"write_p99_ns\":%" PRIu64
           ",\"read_p99_ns\":%" PRIu64 ",\"verified\":true}\n",
           direct ? "direct" : "buffered-readback", blocks * MIB, write_ns, sync_ns,
           read_ns, p99(writes, blocks), p99(reads, blocks));
    free(expected);
    free(observed);
}

int main(int argc, char **argv) {
    int ram = argc == 3 && !strcmp(argv[1], "ram");
    int direct = argc == 4 && !strcmp(argv[1], "direct");
    int buffered = argc == 4 && !strcmp(argv[1], "buffered");
    if (!ram && !direct && !buffered) {
        fputs("Usage: bench ram MiB | bench direct|buffered test-directory MiB\n", stderr);
        return EXIT_FAILURE;
    }
    const char *size = argv[argc - 1];
    char *end;
    errno = 0;
    unsigned long blocks = strtoul(size, &end, 10);
    if (*size < '0' || *size > '9' || *end || errno || blocks < 1 || blocks > 1024) {
        fputs("MiB must be an integer from 1 to 1024\n", stderr);
        return EXIT_FAILURE;
    }
    if (ram) benchmark_ram(blocks * MIB);
    else benchmark_storage(argv[2], blocks, direct);
    return EXIT_SUCCESS;
}
