import Box from '3box';
import React, { Component } from "react";
import { Card, ListGroup } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import styled from 'styled-components';
import { addUserProfile, loadSpace } from '../../actions';
import { box } from "../../sagas";
import { ProfileTile } from "../atoms/ProfileTile";
import PageTemplate from "./PageTemplate";
import css from "./space.less";
import PostThing from '../atoms/PostThing';


const Layout = styled.div`
width: 100%;
display: flex;
overflow: hidden;
flex: 1;


& > .left {
    flex: .8;
    padding-top: 1em;
    
    max-width: 40em;
}
& > .right {
    flex: 0 .2;
    padding-top: 1em;
    padding-right: 2em;
    
}
.menuitems .fas {
    width: 20px;
    text-align: center;
}


 img {
    height: 60px;
    width: 60px;
    border-radius: 50%;
    margin-right: 1em;
}
`




const TEMPORARY_MODERATOR = '0x1cdad033df958291390ba7265be81b84cb6bfcfb'



const Feed = ({ posts }) => {
    return <div className={css.feed}>
        <div className={`heading`}>
            <h3 className='title'>Feed</h3>
        </div>

        <div className={`composer`}>
            <PostThing/>
        </div>

        {/* <PostThing key={postThingKey} submitThing={async (message) => {
            try { 
                await thread.post(message) 
                this.setState({ postThingKey: postThingKey + 1 })
            }
            catch(ex) {
                console.error(ex)
            }
        }}/> */}
            
        { posts
        ? posts.map(post => <Post {...post} {...{
            address: "0x1cdad033df958291390ba7265be81b84cb6bfcfb"
        }}/>)
        : null }

        <footer></footer>
    </div>
}

const Post = ({ timestamp, message, postId, author, address, profile }) => {
    return <div className='post' key={postId}>
        <div className='left'>
            <ProfileTile did={author}/>
        </div>

        <div className='right'>
            <span className="profile-name mt-0">{address || (profile && profile.name) || author}</span>
            <div>{message}</div>
        </div>
    </div>
}

class Page extends Component {
    state = {
        thread: null,
        posts: null,
        postThingKey: 0,
        view: 0
    }

    async componentDidMount() {
        const { addr } = this.props
        
        // open 3chat space
        
        const space = await box.openSpace(addr)

        let myDid = space.DID;

        const thread = await space.joinThread('posts', { 
            members: false,
            firstModerator: TEMPORARY_MODERATOR
        })

        this.setState({
            myDid,
            space,
            thread,
        })

        const posts = await thread.getPosts()

        this.loadPosts(posts)

        this.setState({
            posts
        })

        thread.onUpdate(async res => {
            const posts = await thread.getPosts()
            this.setState({
                posts
            })    
        })
    }

    loadPosts = (posts) => {
        const { profiles } = this.props
        const newUsers = Array.from(new Set(posts.map(post => post.author).filter(did => !profiles[did])))

        newUsers.map(did => {
            Box.getProfile(did).then(profile => {
                this.props.addUserProfile(did, profile)
            })
        })
    }

    render() {
        const { space, thread, posts } = this.state
        if(!space) return '...'

        const name = space && space.name || 'unnamed'
        const { view, postThingKey } = this.state

        const views = {
            home: 0,
            members: 1,
            about: 2
        }

        let content
        switch(view) {
            case views.home:
                content = <Feed {...{ posts }}/>
                break
            case views.members:
                break;
            case views.about:
                content = <div>
                    This space exists at {this.props.addr}.
                </div>
                break;
        }

        return <PageTemplate>
            <div className={css.page}>
            
            <header>
                <a href="/spaces">{`<<`} Back to spaces</a>
            </header>
            
            <h1>{name}</h1>            
            
            <Layout>
                <div className='right'>
                    <Card>
                        <ListGroup style={{ width: '18rem' }} variant="flush" className='menuitems'>
                            <ListGroup.Item action onClick={() => this.setState({ view: views.home })} active={view == views.home}>
                                <i className="fas fa-home"></i>  Home
                            </ListGroup.Item>

                            <ListGroup.Item action onClick={() => this.setState({ view: views.members })}active={view == views.members}>
                                <i className="fas fa-user"></i>  Members
                            </ListGroup.Item>

                            <ListGroup.Item action onClick={() => this.setState({ view: views.about })}active={view == views.about}>
                                <i className="fas fa-info"></i>  About
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </div>

                <div className='left'>
                    {content}
                </div>
            
            </Layout>
            </div>
            
        </PageTemplate>
    }
}


function mapStateToProps(state, props) {
    return {
        space: state.spaces.data[props.addr],
        profiles: state.spaces.profiles
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(
        {
            loadSpace,
            addUserProfile
        },
        dispatch
    )
}

export default connect(mapStateToProps, mapDispatchToProps)(Page)