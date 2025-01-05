require('dotenv').config();
const axios = require('axios');
const Member = require('../models/Members');
const { Responses, membersResponses } = require('../responses/responses');
const Subscription = require('../models/Subscriptions');

const success = Responses.success;
const error = Responses.internalError;
const MOCK_USERS = process.env.MOCK_USERS_URL;


exports.loadingMembers = async () => {
    try 
    {
        let members = [];
        const { data: mockUsers } = await axios.get(MOCK_USERS);

        const allMembers = await Member.find({});
        const subscriptions = await Subscription.find({})
            .populate({
                path: 'movies.movieId', // שליפת פרטי הסרטים
                select: 'name genres image premiered', // שדות הרצויים
            });

        if (allMembers.length === 0) 
        {
            for (const user of mockUsers) {
                const { name, email, address } = user;
                const { city } = address;

                const newMember = await Member.findOneAndUpdate(
                    { email },
                    { name, email, city },
                    { upsert: true, new: true }
                );
                members.push(newMember);
            }
        } 
        else 
        {
            members = allMembers.map((member) => {
                const memberSubscription = subscriptions.find(
                    (sub) => sub.memberId.toString() === member._id.toString()
                );

                const movies = memberSubscription
                    ? memberSubscription?.movies.map((movie) => ({
                          movieId: movie.movieId?._id,
                          name: movie.movieId?.name,
                          genres: movie.movieId?.genres,
                          image: movie.movieId?.image,
                          premiered: movie.movieId?.premiered,
                          date: movie?.date,
                      }))
                    : [];

                return {
                    _id: member._id,
                    name: member.name,
                    email: member.email,
                    city: member.city,
                    subscriptions: movies,
                };
            });
        }
        
        const { code, message } = success;
        return { code, message, members };
    } 
    catch(err) 
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};

exports.newMember = async (req) => {
    try
    {
        const { name, email, city } = req.body;
        const isMemberExists = await Member.findOne({ $or: [{ email }, { name }] });

        const { code: errorCode, message: errorMessage } = membersResponses.memberExists;
        if(isMemberExists?.email === email) return { code: errorCode, message: errorMessage };

        const { code: nameErrorCode, message: nameErrorMessage } = membersResponses.usernameAlreadyTaken;
        if(isMemberExists?.name === name) return { code: nameErrorCode, message: nameErrorMessage };

        const member = await new Member({name, email, city}).save();
        
        const { code, message } = success;
        return { code, message, member };
    }
    catch(err)
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};

exports.newSubscription = async (req) => {
    try {
        const { movieId, date, memberId } = req.body;

        const isMemberExists = await Member.findById(memberId);
        if (!isMemberExists) 
        {
            const { code: errorCode, message: errorMessage } = membersResponses.notExistingMember;
            return { code: errorCode, message: errorMessage };
        }

        const subscription = await Subscription.findOneAndUpdate(
            { memberId },
            { $push: { movies: { movieId, date } } },
            { new: true, upsert: true } 
        ).populate({
            path: 'movies.movieId',
            select: 'name genres image premiered',
        });

        const memberWithSubscriptions = {
            _id: isMemberExists._id,
            name: isMemberExists.name,
            email: isMemberExists.email,
            city: isMemberExists.city,
            subscriptions: subscription.movies.map((movie) => ({
                movieId: movie.movieId._id,
                name: movie.movieId.name,
                date: movie.date,
            })),
        };

        const { code, message } = success;
        return { code, message, member: memberWithSubscriptions };
    } 
    catch(err) 
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};

exports.editMember = async (req) => {
    try {
        let subscription;
        const { _id, name, email, city, subscriptions } = req.body;

        const isMemberExists = await Member.exists({name, _id: { $ne: { _id } }});

        const { code: errorCodeMember, message: errorMessageMember } = membersResponses.usernameAlreadyTaken;
        if(isMemberExists) return { code: errorCodeMember, message: errorMessageMember };

        // Update the member details
        const member = await Member.findOneAndUpdate(
            { _id },
            { name, email, city },
            { new: true }
        );

        // Return an error response if the member is not found
        const { code: errorCode, message: errorMessage } = membersResponses.memberNotFound;
        if (!member) return { code: errorCode, message: errorMessage };

        // Update or create subscriptions if provided
        if (subscriptions && subscriptions.length > 0) 
        {
            subscription = await Subscription.findOneAndUpdate(
                { memberId: _id },
                { movies: subscriptions },
                { new: true, upsert: true }
            ).populate({path: 'movies.movieId', select: 'name'});
        }

        // Reshape subscriptions to move `name` out of `movieId`
        const reshapedSubscriptions = subscription
            ? subscription.movies.map((movie) => ({
                movieId: movie.movieId._id, // Extract the ID
                name: movie.movieId.name,  // Extract the name
                date: movie.date           // Keep the date
            }))
            : [];

        // Merge subscriptions into the member object
        const memberWithSubscriptions = {
            ...member.toObject(),
            subscriptions: reshapedSubscriptions,
        };

        const { code, message } = success;
        return { code, message, member: memberWithSubscriptions };
    } 
    catch(err) 
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};

exports.deleteMember = async (req) => {
    try
    {
        const { id } = req.query;
        const isMemberExists = await Member.deleteOne({_id: id});
        
        const { code: errorCode, message: errorMessage } = membersResponses.memberNotDeleted;
        if( isMemberExists.deletedCount === 0 ) return { code: errorCode, message: errorMessage };

        const members = await Member.find({});
        const { code, message } = success;

        return { code, message, members };
    }
    catch(err)
    {
        const { code, message } = error;
        console.error(err.message);
        return { code, message };
    }
};