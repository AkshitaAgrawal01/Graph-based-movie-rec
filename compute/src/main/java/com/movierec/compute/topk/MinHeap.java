package com.movierec.compute.topk;

import com.movierec.compute.model.Neighbor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Fixed-capacity binary min-heap keyed on similarity (REQ-COMPUTE-4).
 * Holds the K best neighbors seen so far; the root is always the worst of them,
 * so a better candidate evicts the root in O(log K).
 */
public final class MinHeap {

    private final int capacity;
    private final int[] ids;
    private final double[] sims;
    private int size;

    public MinHeap(int capacity) {
        if (capacity < 1) throw new IllegalArgumentException("capacity must be >= 1");
        this.capacity = capacity;
        this.ids = new int[capacity];
        this.sims = new double[capacity];
    }

    /** @return true if the candidate was kept (heap not full, or it beat the current minimum). */
    public boolean offer(int userIdx, double similarity) {
        if (size < capacity) {
            ids[size] = userIdx;
            sims[size] = similarity;
            siftUp(size++);
            return true;
        }
        if (similarity <= sims[0]) return false;
        ids[0] = userIdx;
        sims[0] = similarity;
        siftDown(0);
        return true;
    }

    public int size() { return size; }

    /** Smallest similarity currently held. Only valid when size() > 0. */
    public double minSimilarity() { return sims[0]; }

    /** Contents sorted by similarity descending (ties broken by user index for determinism). */
    public List<Neighbor> toListDescending() {
        List<Neighbor> out = new ArrayList<>(size);
        for (int i = 0; i < size; i++) out.add(new Neighbor(ids[i], sims[i]));
        out.sort(Comparator.comparingDouble(Neighbor::similarity).reversed()
                .thenComparingInt(Neighbor::userIdx));
        return out;
    }

    private void siftUp(int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (sims[p] <= sims[i]) break;
            swap(p, i);
            i = p;
        }
    }

    private void siftDown(int i) {
        while (true) {
            int l = 2 * i + 1, r = l + 1, smallest = i;
            if (l < size && sims[l] < sims[smallest]) smallest = l;
            if (r < size && sims[r] < sims[smallest]) smallest = r;
            if (smallest == i) return;
            swap(i, smallest);
            i = smallest;
        }
    }

    private void swap(int a, int b) {
        int ti = ids[a]; ids[a] = ids[b]; ids[b] = ti;
        double ts = sims[a]; sims[a] = sims[b]; sims[b] = ts;
    }
}
