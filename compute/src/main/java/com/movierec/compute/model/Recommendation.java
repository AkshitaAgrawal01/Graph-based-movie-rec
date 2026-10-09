package com.movierec.compute.model;

/** A recommended movie with its predicted rating for the target user. */
public record Recommendation(String movieId, double score) {}
