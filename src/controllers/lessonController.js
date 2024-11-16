const { Lesson } = require('../models');
const mongoose = require('mongoose');
// const redis = require('redis');
// const client = redis.createClient();

exports.getAllLessons = async (req, res) => {
    try {
        console.log('Fetching all lessons...');
        const lessons = await Lesson.find().sort({ order: 1 });
        console.log('Lessons found:', lessons.length);
        
        res.json({
            success: true,
            data: lessons
        });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lessons'
        });
    }
};

exports.getLessonById = async (req, res) => {
    try {
        console.log('Getting lesson with ID:', req.params.id);
        const lesson = await Lesson.findById(req.params.id)
            .populate('prerequisite', 'title order');
        console.log('Found lesson:', lesson);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            data: lesson
        });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson'
        });
    }
};

exports.getLessonOverview = async (req, res) => {
    const { id } = req.params;

    try {
    //     const cached = await client.get(`lesson:${id}:overview`);
    //     if (cached) {
    //         return res.json({
    //             success: true,
    //             data: JSON.parse(cached)
    //         });
    //     }

        const overview = await Lesson.findById(id)
            .select('learningObjectives prerequisites topics')
            .lean();

        // await client.setEx(
        //     `lesson:${id}:overview`,
        //     3600,
        //     JSON.stringify(overview)
        // );

        res.json({
            success: true,
            data: overview
        });

    } catch (error) {
        console.error('Error fetching overview:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson overview'
        });
    }
};

exports.getLessonContent = async (req, res) => {
    const { id } = req.params;

    try {
        // const cached = await client.get(`lesson:${id}:content`);
        // if (cached) {
        //     return res.json({
        //         success: true,
        //         data: JSON.parse(cached)
        //     });
        // }

        const content = await Lesson.findById(id)
            .select('content keyConcepts interactiveExamples practiceProblems')
            .lean();

        // await client.setEx(
        //     `lesson:${id}:content`,
        //     3600,
        //     JSON.stringify(content)
        // );

        res.json({
            success: true,
            data: content
        });

    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson content'
        });
    }
};

exports.getLessonResources = async (req, res) => {
    const { id } = req.params;

    try {
        // const cached = await client.get(`lesson:${id}:resources`);
        // if (cached) {
        //     return res.json({
        //         success: true,
        //         data: JSON.parse(cached)
        //     });
        // }

        const resources = await Lesson.findById(id)
            .select('additionalReading videos documents externalLinks')
            .lean();

        // await client.setEx(
        //     `lesson:${id}:resources`,
        //     3600,
        //     JSON.stringify(resources)
        // );

        res.json({
            success: true,
            data: resources
        });

    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson resources'
        });
    }
};

exports.getLessonQuiz = async (req, res) => {
    const { id } = req.params;

    try {
        // const cached = await client.get(`lesson:${id}:quiz`);
        // if (cached) {
        //     return res.json({
        //         success: true,
        //         data: JSON.parse(cached)
        //     });
        // }

        const quiz = await Lesson.findById(id)
            .select('quiz')
            .lean();

        // await client.setEx(
        //     `lesson:${id}:quiz`,
        //     3600,
        //     JSON.stringify(quiz)
        // );

        res.json({
            success: true,
            data: quiz
        });

    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching lesson quiz'
        });
    }
};