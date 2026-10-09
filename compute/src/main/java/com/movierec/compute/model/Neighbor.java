package com.movierec.compute.model;

/** A similar user (by graph index) and how similar they are to the target. */
public record Neighbor(int userIdx, double similarity) {}
