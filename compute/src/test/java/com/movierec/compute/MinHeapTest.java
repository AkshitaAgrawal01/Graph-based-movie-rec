package com.movierec.compute;

import com.movierec.compute.model.Neighbor;
import com.movierec.compute.topk.MinHeap;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MinHeapTest {

    @Test
    void keepsOnlyTheKBest() {
        MinHeap h = new MinHeap(3);
        double[] sims = {0.1, 0.9, 0.5, 0.3, 0.7};
        for (int i = 0; i < sims.length; i++) h.offer(i, sims[i]);

        List<Neighbor> top = h.toListDescending();
        assertEquals(3, top.size());
        assertEquals(1, top.get(0).userIdx()); // 0.9
        assertEquals(4, top.get(1).userIdx()); // 0.7
        assertEquals(2, top.get(2).userIdx()); // 0.5
    }

    @Test
    void rejectsCandidateWorseThanMinimumWhenFull() {
        MinHeap h = new MinHeap(2);
        assertTrue(h.offer(0, 0.8));
        assertTrue(h.offer(1, 0.6));
        assertFalse(h.offer(2, 0.4));
        assertFalse(h.offer(3, 0.6)); // ties do not evict
        assertEquals(0.6, h.minSimilarity(), 0.0);
    }

    @Test
    void evictsMinimumWhenBetterArrives() {
        MinHeap h = new MinHeap(2);
        h.offer(0, 0.5);
        h.offer(1, 0.6);
        assertTrue(h.offer(2, 0.9));
        List<Neighbor> top = h.toListDescending();
        assertEquals(2, top.get(0).userIdx());
        assertEquals(1, top.get(1).userIdx());
    }
}
