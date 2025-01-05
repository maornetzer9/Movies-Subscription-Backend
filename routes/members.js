const express = require('express');
const { loadMembersController, newMemberController, deleteMemberController, editMemberController, newSubscriptionController } = require('../controllers/members');

const router = express.Router();

router.get('/',                  loadMembersController     );
router.put('/edit',              editMemberController      );
router.post('/add',              newMemberController       );
router.post('/new-subscription', newSubscriptionController );
router.delete('/delete',         deleteMemberController    );

module.exports = { membersRouter: router };